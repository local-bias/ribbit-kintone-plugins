import {
  addAllRecords,
  addRecord,
  getAllRecordsWithId,
  type kintoneAPI,
  updateAllRecords,
  updateRecord,
} from '@konomi-app/kintone-utilities';
import { parseKintoneErrorMessages } from './kintone-error';
import type { ErrorBehavior, ImportMode } from './types';

type RecordData = kintoneAPI.RecordData;

/** kintoneのレコード番号フィールドのタイプ */
const RECORD_NUMBER_TYPE = 'RECORD_NUMBER';

/** インポート実行のパラメータ */
export interface ExecuteImportParams {
  appId: number;
  guestSpaceId: string | undefined;
  mode: ImportMode;
  /** エラー発生時の挙動（skip の場合はレコード単位で実行し、エラー行以外を取り込む） */
  errorBehavior: ErrorBehavior;
  /** 取り込み対象のレコード */
  records: RecordData[];
  /** 各レコードの更新キーの値（records と同じ並び順） */
  keyValues: string[];
  /** 各レコードの元のCSVデータ行番号（1始まり、records と同じ並び順） */
  rowNumbers: number[];
  /** 更新キーのフィールドコード（追加のみの場合は未使用） */
  keyFieldCode: string;
  /** 更新キーのフィールドタイプ（レコード番号かどうかの判定に使用） */
  keyFieldType: string;
  /** 進捗コールバック */
  onProgress: (done: number, total: number) => void;
}

/** レコード単位の失敗情報 */
export interface ImportFailure {
  /** 元のCSVデータ行番号 */
  rowNumber: number;
  /** kintone API のエラーメッセージ */
  message: string;
}

/** インポート結果のサマリー */
export interface ImportSummary {
  added: number;
  updated: number;
  /** レコード単位実行で失敗した行（一括実行・成功時は空） */
  failures: ImportFailure[];
}

/** 更新リクエスト1件分の型（id指定 または updateKey指定） */
type UpdateRequest =
  | { id: string; record: RecordData }
  | { updateKey: { field: string; value: string }; record: RecordData };

/** updateAllRecords へ渡す records 引数の型 */
type UpdateRecordsArg = Parameters<typeof updateAllRecords>[0]['records'];

/** レコードから指定したフィールドを除外した新しいレコードを返します。 */
function omitField(record: RecordData, fieldCode: string): RecordData {
  if (!fieldCode || !(fieldCode in record)) {
    return record;
  }
  const { [fieldCode]: _omitted, ...rest } = record;
  return rest;
}

/** addAllRecords へ渡すレコード型へのキャスト用ヘルパー */
function asAddRecords(records: RecordData[]): kintoneAPI.rest.RecordToRequest[] {
  return records as kintoneAPI.rest.RecordToRequest[];
}

/** 指定フィールドの値をキー、レコードIDを値とするマップを構築します。 */
async function fetchRecordIdsByKey(
  appId: number,
  guestSpaceId: string | undefined,
  keyFieldCode: string
): Promise<Map<string, string>> {
  const existing = await getAllRecordsWithId({
    app: appId,
    guestSpaceId,
    fields: [keyFieldCode],
  });

  const map = new Map<string, string>();
  for (const record of existing) {
    const keyValue = String(record[keyFieldCode]?.value ?? '');
    map.set(keyValue, record.$id.value);
  }
  return map;
}

// ============================================================
// 一括実行（bulkRequest）: errorBehavior === 'abort' で使用
// ============================================================

/** レコードの追加のみを一括実行します。 */
async function executeBulkAdd(params: ExecuteImportParams): Promise<ImportSummary> {
  const { appId, guestSpaceId, records, onProgress } = params;
  await addAllRecords({
    app: appId,
    guestSpaceId,
    records: asAddRecords(records),
    onProgress: ({ total, done }) => onProgress(done, total),
  });
  return { added: records.length, updated: 0, failures: [] };
}

/** レコード番号をキーにした更新リクエストを構築します（IDへ解決）。 */
function buildRecordIdRequests(
  records: RecordData[],
  keyValues: string[],
  keyFieldCode: string,
  idByKey: Map<string, string>
): UpdateRequest[] {
  const notFound: string[] = [];
  const requests: UpdateRequest[] = [];

  records.forEach((record, index) => {
    const keyValue = keyValues[index] ?? '';
    const id = idByKey.get(keyValue);
    if (!id) {
      notFound.push(keyValue);
      return;
    }
    requests.push({ id, record: omitField(record, keyFieldCode) });
  });

  if (notFound.length > 0) {
    throw new Error(`レコード番号が見つかりませんでした: ${notFound.join(', ')}`);
  }
  return requests;
}

/** レコードの更新のみを一括実行します。 */
async function executeBulkUpdate(params: ExecuteImportParams): Promise<ImportSummary> {
  const { appId, guestSpaceId, records, keyValues, keyFieldCode, keyFieldType, onProgress } =
    params;

  let requests: UpdateRequest[];
  if (keyFieldType === RECORD_NUMBER_TYPE) {
    const idByKey = await fetchRecordIdsByKey(appId, guestSpaceId, keyFieldCode);
    requests = buildRecordIdRequests(records, keyValues, keyFieldCode, idByKey);
  } else {
    requests = records.map((record, index) => ({
      updateKey: { field: keyFieldCode, value: keyValues[index] ?? '' },
      record: omitField(record, keyFieldCode),
    }));
  }

  await updateAllRecords({
    app: appId,
    guestSpaceId,
    records: requests as unknown as UpdateRecordsArg,
    onProgress: ({ total, done }) => onProgress(done, total),
  });
  return { added: 0, updated: requests.length, failures: [] };
}

/** 既存キーに基づいて追加・更新を振り分け、一括実行します（アップサート）。 */
async function executeBulkUpsert(params: ExecuteImportParams): Promise<ImportSummary> {
  const { appId, guestSpaceId, records, keyValues, keyFieldCode, keyFieldType, onProgress } =
    params;
  const isRecordNumber = keyFieldType === RECORD_NUMBER_TYPE;

  const idByKey = await fetchRecordIdsByKey(appId, guestSpaceId, keyFieldCode);

  const addTargets: RecordData[] = [];
  const updateTargets: UpdateRequest[] = [];

  records.forEach((record, index) => {
    const keyValue = keyValues[index] ?? '';
    const id = keyValue !== '' ? idByKey.get(keyValue) : undefined;
    if (!id) {
      addTargets.push(record);
      return;
    }
    updateTargets.push(
      isRecordNumber
        ? { id, record: omitField(record, keyFieldCode) }
        : {
            updateKey: { field: keyFieldCode, value: keyValue },
            record: omitField(record, keyFieldCode),
          }
    );
  });

  const total = addTargets.length + updateTargets.length;

  if (addTargets.length > 0) {
    await addAllRecords({
      app: appId,
      guestSpaceId,
      records: asAddRecords(addTargets),
      onProgress: ({ done }) => onProgress(done, total),
    });
  }

  if (updateTargets.length > 0) {
    await updateAllRecords({
      app: appId,
      guestSpaceId,
      records: updateTargets as unknown as UpdateRecordsArg,
      onProgress: ({ done }) => onProgress(addTargets.length + done, total),
    });
  }

  return { added: addTargets.length, updated: updateTargets.length, failures: [] };
}

function executeBulk(params: ExecuteImportParams): Promise<ImportSummary> {
  switch (params.mode) {
    case 'add':
      return executeBulkAdd(params);
    case 'update':
      return executeBulkUpdate(params);
    case 'upsert':
      return executeBulkUpsert(params);
    default:
      return executeBulkAdd(params);
  }
}

// ============================================================
// レコード単位実行: errorBehavior === 'skip' で使用
// （エラー行以外を取り込めるよう、1件ずつリクエストする）
// ============================================================

type RecordOutcome = 'added' | 'updated';

interface ImportOneParams {
  appId: number;
  guestSpaceId: string | undefined;
  mode: ImportMode;
  record: RecordData;
  keyValue: string;
  keyFieldCode: string;
  isRecordNumber: boolean;
  idByKey: Map<string, string> | null;
}

/** 1件のレコードを追加または更新します。 */
async function importOneRecord(params: ImportOneParams): Promise<RecordOutcome> {
  const { appId, guestSpaceId, mode, record, keyValue, keyFieldCode, isRecordNumber, idByKey } =
    params;
  const app = appId;
  const body = omitField(record, keyFieldCode);

  if (mode === 'add') {
    await addRecord({ app, guestSpaceId, record });
    return 'added';
  }

  if (mode === 'update') {
    if (isRecordNumber) {
      const id = idByKey?.get(keyValue);
      if (!id) {
        throw new Error(`レコード番号 ${keyValue} が見つかりません。`);
      }
      await updateRecord({ app, guestSpaceId, id, record: body });
    } else {
      await updateRecord({
        app,
        guestSpaceId,
        updateKey: { field: keyFieldCode, value: keyValue },
        record: body,
      });
    }
    return 'updated';
  }

  // upsert: 既存なら更新、なければ追加
  const existingId = keyValue !== '' ? idByKey?.get(keyValue) : undefined;
  if (existingId) {
    if (isRecordNumber) {
      await updateRecord({ app, guestSpaceId, id: existingId, record: body });
    } else {
      await updateRecord({
        app,
        guestSpaceId,
        updateKey: { field: keyFieldCode, value: keyValue },
        record: body,
      });
    }
    return 'updated';
  }

  await addRecord({ app, guestSpaceId, record });
  return 'added';
}

async function executePerRecord(params: ExecuteImportParams): Promise<ImportSummary> {
  const {
    appId,
    guestSpaceId,
    mode,
    records,
    keyValues,
    rowNumbers,
    keyFieldCode,
    keyFieldType,
    onProgress,
  } = params;
  const isRecordNumber = keyFieldType === RECORD_NUMBER_TYPE;

  // アップサート、またはレコード番号キーの更新では既存レコードのIDが必要
  const needsIdMap = mode === 'upsert' || (mode === 'update' && isRecordNumber);
  const idByKey = needsIdMap
    ? await fetchRecordIdsByKey(appId, guestSpaceId, keyFieldCode)
    : null;

  let added = 0;
  let updated = 0;
  const failures: ImportFailure[] = [];
  const total = records.length;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record) {
      continue;
    }
    const keyValue = keyValues[i] ?? '';
    const rowNumber = rowNumbers[i] ?? i + 1;

    try {
      const outcome = await importOneRecord({
        appId,
        guestSpaceId,
        mode,
        record,
        keyValue,
        keyFieldCode,
        isRecordNumber,
        idByKey,
      });
      if (outcome === 'added') {
        added += 1;
      } else {
        updated += 1;
      }
    } catch (error) {
      const message = parseKintoneErrorMessages(error).join(' / ');
      failures.push({ rowNumber, message });
    }

    onProgress(i + 1, total);
  }

  return { added, updated, failures };
}

/**
 * インポートを実行します。
 * - errorBehavior === 'abort': bulkRequest による一括実行（高速・チャンク単位でアトミック）
 * - errorBehavior === 'skip': レコード単位実行（エラー行以外を取り込み、失敗行を収集）
 */
export function executeImport(params: ExecuteImportParams): Promise<ImportSummary> {
  if (params.errorBehavior === 'skip') {
    return executePerRecord(params);
  }
  return executeBulk(params);
}
