import styled from '@emotion/styled';
import { getFormFields, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { Drawer } from '@mui/material';
import { Upload } from 'lucide-react';
import { enqueueSnackbar } from 'notistack';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import type { PluginCondition } from '@/schema/plugin-config';
import {
  buildRecordsFromCsv,
  createDefaultMapping,
  getImportableFields,
  getImportValidationConditions,
  getUpdateKeyCandidates,
  parseCsv,
  type RecordValidationError,
  validateRecords,
  validateUpdateKeys,
} from '../build-records';
import { decodeCsvBytes } from '../encoding';
import { executeImport } from '../import-executor';
import { parseKintoneErrorMessages } from '../kintone-error';
import {
  type ColumnMapping,
  DEFAULT_IMPORT_SETTINGS,
  type ImportSettings,
  PREVIEW_ROW_COUNT,
} from '../types';
import { ConfirmPanel } from './confirm-panel';
import { ErrorPanel } from './error-panel';
import { ProcessingPanel } from './processing-panel';
import { ResultPanel } from './result-panel';
import { SettingsPanel } from './settings-panel';

type RecordData = kintoneAPI.RecordData;

const StyledButton = styled.button`
  height: 48px;
  padding: 0 24px 0 16px;
  border: 1px solid #e3e7e8;
  border-radius: 0;
  background-color: #f7f9fa;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: 48px;
  margin: 0 4px;
  white-space: nowrap;
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 8px;
  transition:
    color 0.25s ease,
    border-color 0.25s ease,
    background-color 0.2s ease;

  svg {
    color: #a8a8a8;
  }

  &:hover {
    border-color: #3498db;
    color: #3498db;
    svg {
      color: #3498db;
    }
  }

  &:active {
    background-color: #edf1f3;
  }

  &:disabled {
    color: #999;
    cursor: wait;
    pointer-events: none;
  }
`;

/** インポート確認・実行に必要な確定済みデータ */
interface ConfirmPayload {
  records: RecordData[];
  keyValues: string[];
  /** 各レコードの元のCSVデータ行番号（records と同じ並び順） */
  rowNumbers: number[];
  settings: ImportSettings;
  /** 更新キーのフィールドタイプ（レコード番号判定用） */
  keyFieldType: string;
}

/**
 * ドロワー内で表示するステップ。1枚のドロワーの中身だけを切り替える。
 */
type Stage =
  | { type: 'idle' }
  | { type: 'settings' }
  | {
      type: 'errors';
      errors: RecordValidationError[];
      totalCount: number;
      proceed: ConfirmPayload | null;
    }
  | { type: 'confirm'; payload: ConfirmPayload }
  | { type: 'processing'; total: number; done: number }
  | { type: 'result'; total: number; succeeded: number; failed: number; errorMessages: string[] };

/** 選択されたファイルから読み取った、設定ステップ表示に必要な状態 */
interface PendingFile {
  bytes: Uint8Array;
  properties: kintoneAPI.FieldProperties;
  detectedEncodingLabel: string;
}

/** CSVのパース結果（エラー時はメッセージを保持） */
interface ParsedCsvResult {
  headers: string[];
  rows: string[][];
  error: string | null;
}

interface ImportButtonProps {
  label: string;
  appId: number;
  guestSpaceId: string | undefined;
  conditions: PluginCondition[];
  onImported: () => void;
}

export const ImportButton: FC<ImportButtonProps> = ({
  label,
  appId,
  guestSpaceId,
  conditions,
  onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_IMPORT_SETTINGS);
  const [mapping, setMapping] = useState<ColumnMapping>([]);
  const [stage, setStage] = useState<Stage>({ type: 'idle' });

  // 選択された文字コードで毎回デコードする（AUTO の場合は自動検出）
  const decodedText = useMemo(
    () => (pending ? decodeCsvBytes(pending.bytes, settings.encoding).text : null),
    [pending, settings.encoding]
  );

  // デコード結果を現在の区切り文字でパースする
  const parsed = useMemo<ParsedCsvResult | null>(() => {
    if (decodedText === null) {
      return null;
    }
    try {
      const { headers, rows } = parseCsv(decodedText, settings.delimiter);
      return { headers, rows, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSVの解析に失敗しました。';
      return { headers: [], rows: [], error: message };
    }
  }, [decodedText, settings.delimiter]);

  const importableFields = useMemo(
    () => (pending ? getImportableFields(pending.properties) : []),
    [pending]
  );

  // 更新キーの候補は「マッピング済み」かつ「レコード番号・重複禁止フィールド」に限定する
  const updateKeyCandidates = useMemo(() => {
    if (!pending) {
      return [];
    }
    return getUpdateKeyCandidates(pending.properties).filter((candidate) =>
      mapping.includes(candidate.code)
    );
  }, [pending, mapping]);

  const previewRows = useMemo(
    () => (parsed ? parsed.rows.slice(0, PREVIEW_ROW_COUNT) : []),
    [parsed]
  );

  // ヘッダーが変わった（文字コード・区切り文字の変更や、ファイル選択）ら初期マッピングを再生成する
  const headerSignature = parsed && !parsed.error ? parsed.headers.join('') : null;
  useEffect(() => {
    if (pending && parsed && !parsed.error) {
      setMapping(createDefaultMapping(parsed.headers, pending.properties));
    }
  }, [headerSignature, pending, parsed]);

  // マッピング変更で現在の更新キーが候補から外れたらクリアする
  useEffect(() => {
    if (
      settings.updateKeyField &&
      !updateKeyCandidates.some((candidate) => candidate.code === settings.updateKeyField)
    ) {
      setSettings((prev) => ({ ...prev, updateKeyField: '' }));
    }
  }, [updateKeyCandidates, settings.updateKeyField]);

  const resetFlow = () => {
    setPending(null);
    setMapping([]);
    setStage({ type: 'idle' });
  };

  const handleMappingChange = (columnIndex: number, fieldCode: string) => {
    setMapping((prev) => prev.map((code, index) => (index === columnIndex ? fieldCode : code)));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 同じファイルを連続で選択してもイベントが発火するようリセットする
    event.target.value = '';
    if (!file) {
      return;
    }

    setIsPreparing(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { detectedLabel } = decodeCsvBytes(bytes, 'AUTO');
      const { properties } = await getFormFields({ app: appId, guestSpaceId });

      setSettings(DEFAULT_IMPORT_SETTINGS);
      setMapping([]);
      setPending({ bytes, properties, detectedEncodingLabel: detectedLabel });
      setStage({ type: 'settings' });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'CSVの読み込みに失敗しました。';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setIsPreparing(false);
    }
  };

  const handleSettingsConfirm = () => {
    if (!pending || !parsed || parsed.error) {
      return;
    }

    const { rows } = parsed;
    if (rows.length === 0) {
      enqueueSnackbar('データ行が見つかりませんでした。', { variant: 'warning' });
      return;
    }

    try {
      const keyFieldCode = settings.mode === 'add' ? '' : settings.updateKeyField;
      const keyFieldType = keyFieldCode ? (pending.properties[keyFieldCode]?.type ?? '') : '';
      const { records, keyValues } = buildRecordsFromCsv(
        rows,
        mapping,
        pending.properties,
        keyFieldCode
      );
      const rowNumbers = records.map((_, index) => index + 1);

      const validationConditions = getImportValidationConditions(conditions, settings.mode);
      const errors = [
        ...validateRecords(records, validationConditions),
        // 更新のみの場合、更新キーが空の行はエラーとして扱う
        ...(settings.mode === 'update' ? validateUpdateKeys(keyValues, keyFieldCode) : []),
      ];

      if (errors.length === 0) {
        setStage({
          type: 'confirm',
          payload: { records, keyValues, rowNumbers, settings, keyFieldType },
        });
        return;
      }

      const proceed =
        settings.errorBehavior === 'skip'
          ? buildSkipPayload(records, keyValues, rowNumbers, errors, settings, keyFieldType)
          : null;
      setStage({ type: 'errors', errors, totalCount: records.length, proceed });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'CSVの処理に失敗しました。';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleImport = async (payload: ConfirmPayload) => {
    const total = payload.records.length;
    setStage({ type: 'processing', total, done: 0 });
    // bulkRequest 単位でコミットされるため、最後に成功した件数を控える（一括実行の失敗時に使用）
    let committed = 0;
    try {
      const summary = await executeImport({
        appId,
        guestSpaceId,
        mode: payload.settings.mode,
        errorBehavior: payload.settings.errorBehavior,
        records: payload.records,
        keyValues: payload.keyValues,
        rowNumbers: payload.rowNumbers,
        keyFieldCode: payload.settings.updateKeyField,
        keyFieldType: payload.keyFieldType,
        onProgress: (done, progressTotal) => {
          committed = done;
          setStage({ type: 'processing', total: progressTotal, done });
        },
      });
      const failed = summary.failures.length;
      setStage({
        type: 'result',
        total,
        succeeded: summary.added + summary.updated,
        failed,
        errorMessages: summary.failures.map(
          (failure) => `行 ${failure.rowNumber}: ${failure.message}`
        ),
      });
    } catch (error) {
      console.error(error);
      setStage({
        type: 'result',
        total,
        succeeded: committed,
        failed: total - committed,
        errorMessages: parseKintoneErrorMessages(error),
      });
    }
  };

  const closeResult = () => {
    const shouldReload = stage.type === 'result' && stage.succeeded > 0;
    resetFlow();
    if (shouldReload) {
      onImported();
    }
  };

  const handleDrawerClose = () => {
    // 取り込み中は閉じさせない
    if (stage.type === 'processing') {
      return;
    }
    if (stage.type === 'result') {
      closeResult();
      return;
    }
    resetFlow();
  };

  return (
    <>
      <StyledButton
        type='button'
        disabled={isPreparing || stage.type !== 'idle'}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={16} />
        {label}
      </StyledButton>
      <input
        ref={fileInputRef}
        type='file'
        accept='.csv,.txt,text/csv'
        hidden
        onChange={handleFileChange}
      />

      <Drawer
        anchor='right'
        open={stage.type !== 'idle'}
        onClose={handleDrawerClose}
        slotProps={{ paper: { sx: { width: '80vw', maxWidth: '80vw' } } }}
      >
        {stage.type === 'settings' && (
          <SettingsPanel
            settings={settings}
            detectedEncodingLabel={pending?.detectedEncodingLabel ?? ''}
            updateKeyCandidates={updateKeyCandidates}
            headers={parsed?.headers ?? []}
            previewRows={previewRows}
            mapping={mapping}
            importableFields={importableFields}
            parseError={parsed?.error ?? null}
            onChange={setSettings}
            onMappingChange={handleMappingChange}
            onCancel={resetFlow}
            onConfirm={handleSettingsConfirm}
          />
        )}

        {stage.type === 'errors' && (
          <ErrorPanel
            errors={stage.errors}
            totalCount={stage.totalCount}
            errorRowCount={new Set(stage.errors.map((error) => error.rowNumber)).size}
            canProceed={stage.proceed !== null}
            onBack={() => setStage({ type: 'settings' })}
            onProceed={() => {
              if (stage.proceed) {
                setStage({ type: 'confirm', payload: stage.proceed });
              }
            }}
          />
        )}

        {stage.type === 'confirm' && (
          <ConfirmPanel
            message={buildConfirmMessage(stage.payload)}
            count={stage.payload.records.length}
            onBack={() => setStage({ type: 'settings' })}
            onConfirm={() => void handleImport(stage.payload)}
          />
        )}

        {stage.type === 'processing' && (
          <ProcessingPanel total={stage.total} done={stage.done} />
        )}

        {stage.type === 'result' && (
          <ResultPanel
            total={stage.total}
            succeeded={stage.succeeded}
            failed={stage.failed}
            errorMessages={stage.errorMessages}
            onClose={closeResult}
          />
        )}
      </Drawer>
    </>
  );
};

/** skipモード時に、エラー行を除いた有効レコードの確定データを構築します。 */
function buildSkipPayload(
  records: RecordData[],
  keyValues: string[],
  rowNumbers: number[],
  errors: RecordValidationError[],
  settings: ImportSettings,
  keyFieldType: string
): ConfirmPayload {
  const invalidRows = new Set(errors.map((error) => error.rowNumber));
  const validRecords: RecordData[] = [];
  const validKeyValues: string[] = [];
  const validRowNumbers: number[] = [];

  records.forEach((record, index) => {
    if (!invalidRows.has(index + 1)) {
      validRecords.push(record);
      validKeyValues.push(keyValues[index] ?? '');
      validRowNumbers.push(rowNumbers[index] ?? index + 1);
    }
  });

  return {
    records: validRecords,
    keyValues: validKeyValues,
    rowNumbers: validRowNumbers,
    settings,
    keyFieldType,
  };
}

/** インポート方法に応じた確認メッセージを構築します。 */
function buildConfirmMessage(payload: ConfirmPayload): string {
  const count = payload.records.length;
  switch (payload.settings.mode) {
    case 'add':
      return `${count}件のレコードを追加します。よろしいですか？`;
    case 'update':
      return `${count}件のレコードを更新します。よろしいですか？`;
    case 'upsert':
      return `${count}件のレコードを更新または追加します。よろしいですか？`;
    default:
      return `${count}件のレコードを取り込みます。よろしいですか？`;
  }
}
