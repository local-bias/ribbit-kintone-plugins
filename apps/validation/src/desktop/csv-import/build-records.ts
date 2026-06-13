import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import Papa from 'papaparse';
import { validateCondition } from '@/lib/validation';
import type { PluginCondition } from '@/schema/plugin-config';
import { normalizeDateTimeValue, normalizeDateValue, normalizeTimeValue } from './date-format';
import {
  type ColumnMapping,
  type DelimiterOption,
  getValidationEventsForMode,
  type ImportableField,
  type ImportMode,
  type UpdateKeyCandidate,
} from './types';

type RecordData = kintoneAPI.RecordData;
type FieldProperties = kintoneAPI.FieldProperties;

/** kintone標準のCSVインポートで取り込み対象外となるフィールドタイプ */
const NON_IMPORTABLE_FIELD_TYPES = new Set<string>([
  'CALC',
  'CATEGORY',
  'STATUS',
  'STATUS_ASSIGNEE',
  'RECORD_NUMBER',
  'CREATED_TIME',
  'UPDATED_TIME',
  'CREATOR',
  'MODIFIER',
  'FILE',
  'SUBTABLE',
  '__ID__',
  '__REVISION__',
]);

/** 値が複数選択（配列）となるフィールドタイプ */
const MULTI_VALUE_FIELD_TYPES = new Set<string>(['CHECK_BOX', 'MULTI_SELECT', 'CATEGORY']);

/** 値がエンティティ（コードの配列）となるフィールドタイプ */
const ENTITY_FIELD_TYPES = new Set<string>(['USER_SELECT', 'ORGANIZATION_SELECT', 'GROUP_SELECT']);

/** 書き込みはできないが、更新キーとしてマッピング可能なフィールドタイプ */
const KEY_ONLY_FIELD_TYPES = new Set<string>(['RECORD_NUMBER']);

/**
 * CSV列の割り当て先として指定可能なフィールドタイプか判定します。
 * 取り込み対象フィールドに加え、更新キーに使えるレコード番号も対象とします。
 */
function isMappableFieldType(type: string): boolean {
  return !NON_IMPORTABLE_FIELD_TYPES.has(type) || KEY_ONLY_FIELD_TYPES.has(type);
}

/** 1レコード分のバリデーション結果 */
export interface RecordValidationError {
  /** データ行番号（1始まり、ヘッダー行を除く） */
  rowNumber: number;
  /** 対象フィールドコード */
  fieldCode: string;
  /** エラーメッセージ */
  errorMessage: string;
}

/** CSVパース結果 */
export interface ParsedCsv {
  /** ヘッダー（フィールドコードの配列） */
  headers: string[];
  /** データ行（各行はセル文字列の配列） */
  rows: string[][];
}

/** 区切り文字オプションを Papa Parse のデリミタ文字へ変換します。 */
function toDelimiterChar(delimiter: DelimiterOption): string {
  return delimiter === 'tab' ? '\t' : ',';
}

/**
 * CSV文字列をパースします。先頭行をヘッダー（フィールドコード）として扱います。
 */
export function parseCsv(content: string, delimiter: DelimiterOption = 'comma'): ParsedCsv {
  const result = Papa.parse<string[]>(content, {
    skipEmptyLines: 'greedy',
    delimiter: toDelimiterChar(delimiter),
  });

  if (result.errors.length > 0) {
    const [firstError] = result.errors;
    throw new Error(`CSVの解析に失敗しました: ${firstError?.message ?? '不明なエラー'}`);
  }

  const [headers, ...rows] = result.data;
  if (!headers || headers.length === 0) {
    throw new Error('CSVにヘッダー行が見つかりませんでした。');
  }

  return {
    headers: headers.map((header) => header.trim()),
    rows,
  };
}

/**
 * セルの文字列値を、フィールドタイプに応じたkintoneレコードの値へ変換します。
 */
function buildFieldValue(fieldType: string, cell: string): kintoneAPI.Field['value'] {
  if (MULTI_VALUE_FIELD_TYPES.has(fieldType)) {
    return cell
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (ENTITY_FIELD_TYPES.has(fieldType)) {
    return cell
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((code) => ({ code }));
  }
  // 日付・日時・時刻は柔軟なフォーマットを受け付け、kintoneのISO形式へ正規化する
  if (fieldType === 'DATE') {
    return normalizeDateValue(cell);
  }
  if (fieldType === 'DATETIME') {
    return normalizeDateTimeValue(cell);
  }
  if (fieldType === 'TIME') {
    return normalizeTimeValue(cell);
  }
  return cell;
}

/**
 * マッピングに従ってCSVの1行をkintoneレコードへ変換します。
 * 「取り込まない」列、取り込み対象外のフィールド、フォームに存在しないフィールドは無視されます。
 */
export function buildRecordFromMapping(
  mapping: ColumnMapping,
  row: string[],
  properties: FieldProperties
): RecordData {
  const record: RecordData = {};

  for (let i = 0; i < mapping.length; i++) {
    const fieldCode = mapping[i];
    if (!fieldCode) {
      continue;
    }

    const property = properties[fieldCode];
    if (!property || NON_IMPORTABLE_FIELD_TYPES.has(property.type)) {
      continue;
    }

    const cell = row[i] ?? '';
    record[fieldCode] = {
      type: property.type,
      value: buildFieldValue(property.type, cell),
    } as kintoneAPI.Field;
  }

  return record;
}

/**
 * 全レコードに対して、有効な条件のバリデーションを適用します。
 * エラーがあったものをすべて収集して返します。
 */
export function validateRecords(
  records: RecordData[],
  conditions: PluginCondition[]
): RecordValidationError[] {
  const errors: RecordValidationError[] = [];

  for (let rowIndex = 0; rowIndex < records.length; rowIndex++) {
    const record = records[rowIndex];
    if (!record) {
      continue;
    }
    for (const condition of conditions) {
      const result = validateCondition(condition, record);
      if (!result.isValid) {
        errors.push({
          rowNumber: rowIndex + 1,
          fieldCode: condition.fieldCode,
          errorMessage: result.errorMessage,
        });
      }
    }
  }

  return errors;
}

/**
 * インポート方法に応じた対象画面を含み、ルールが設定された有効な条件のみを抽出します。
 */
export function getImportValidationConditions(
  conditions: PluginCondition[],
  mode: ImportMode
): PluginCondition[] {
  const events = getValidationEventsForMode(mode);
  return conditions.filter(
    (condition) =>
      condition.fieldCode &&
      condition.rules.length > 0 &&
      condition.targetEvents.some((event) => events.includes(event))
  );
}

/** CSVの各行から構築したレコードと、更新キーの値の組 */
export interface BuiltRecords {
  /** 構築されたレコードの配列 */
  records: RecordData[];
  /** 各レコードの更新キーの値（キーフィールド未指定時は空文字列） */
  keyValues: string[];
}

/**
 * マッピングに従ってCSVの全行をkintoneレコードへ変換し、
 * 併せて各行の更新キーの値を抽出します。
 * keyFieldCode が指定された場合、その列の生の値を更新キーの値として返します。
 */
export function buildRecordsFromCsv(
  rows: string[][],
  mapping: ColumnMapping,
  properties: FieldProperties,
  keyFieldCode = ''
): BuiltRecords {
  const keyColumnIndex = keyFieldCode ? mapping.indexOf(keyFieldCode) : -1;

  const records: RecordData[] = [];
  const keyValues: string[] = [];

  for (const row of rows) {
    records.push(buildRecordFromMapping(mapping, row, properties));
    keyValues.push(keyColumnIndex >= 0 ? (row[keyColumnIndex] ?? '').trim() : '');
  }

  return { records, keyValues };
}

/**
 * CSV列の割り当て先として指定可能なフィールドの一覧を返します。
 */
export function getImportableFields(properties: FieldProperties): ImportableField[] {
  const fields: ImportableField[] = [];

  for (const property of Object.values(properties)) {
    if (isMappableFieldType(property.type)) {
      fields.push({ code: property.code, label: property.label, type: property.type });
    }
  }

  return fields;
}

/**
 * CSVヘッダーとフィールド（コードまたはラベル）が一致する列を自動的に割り当て、
 * 初期マッピングを生成します。一致しない列は「取り込まない」（空文字列）になります。
 */
export function createDefaultMapping(
  headers: string[],
  properties: FieldProperties
): ColumnMapping {
  const lookup = new Map<string, string>();
  for (const property of Object.values(properties)) {
    if (!isMappableFieldType(property.type)) {
      continue;
    }
    lookup.set(property.code, property.code);
    lookup.set(property.label, property.code);
  }

  return headers.map((header) => lookup.get(header.trim()) ?? '');
}

/**
 * 更新キーに指定可能なフィールドの候補を返します。
 * - レコード番号（kintoneが付与する一意な番号）
 * - 値の重複を禁止したフィールド
 */
export function getUpdateKeyCandidates(properties: FieldProperties): UpdateKeyCandidate[] {
  const candidates: UpdateKeyCandidate[] = [];

  for (const property of Object.values(properties)) {
    const isRecordNumber = property.type === 'RECORD_NUMBER';
    const isUniqueField = 'unique' in property && property.unique === true;
    if (isRecordNumber || isUniqueField) {
      candidates.push({ code: property.code, label: property.label });
    }
  }

  return candidates;
}

/**
 * 更新モードで更新キーの値が空の行を、入力チェックエラーとして検出します。
 * （更新には必ずキーが必要なため）
 */
export function validateUpdateKeys(
  keyValues: string[],
  keyFieldCode: string
): RecordValidationError[] {
  const errors: RecordValidationError[] = [];

  for (let i = 0; i < keyValues.length; i++) {
    if (!keyValues[i]) {
      errors.push({
        rowNumber: i + 1,
        fieldCode: keyFieldCode,
        errorMessage: '更新キーの値が空です。',
      });
    }
  }

  return errors;
}
