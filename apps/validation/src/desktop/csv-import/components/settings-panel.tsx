import {
  Alert,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { FC } from 'react';
import type {
  ColumnMapping,
  DelimiterOption,
  EncodingOption,
  ErrorBehavior,
  ImportableField,
  ImportMode,
  ImportSettings,
  UpdateKeyCandidate,
} from '../types';
import { DrawerLayout } from './drawer-layout';
import { MappingPreviewTable } from './mapping-preview-table';

interface SettingsPanelProps {
  settings: ImportSettings;
  /** 自動検出された文字コードの表示用ラベル */
  detectedEncodingLabel: string;
  /** 更新キーの候補（マッピング済みの重複禁止フィールド・レコード番号） */
  updateKeyCandidates: UpdateKeyCandidate[];
  /** CSVのヘッダー行 */
  headers: string[];
  /** プレビュー表示用のデータ行（先頭数件） */
  previewRows: string[][];
  /** 列ごとの割り当て先フィールドコード */
  mapping: ColumnMapping;
  /** マッピング先に指定可能なフィールド */
  importableFields: ImportableField[];
  /** CSV解析エラー（解析できた場合は null） */
  parseError: string | null;
  onChange: (settings: ImportSettings) => void;
  onMappingChange: (columnIndex: number, fieldCode: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const ENCODING_OPTIONS: { value: EncodingOption; label: string }[] = [
  { value: 'AUTO', label: '自動判定' },
  { value: 'UTF8', label: 'UTF-8' },
  { value: 'SJIS', label: 'Shift_JIS' },
  { value: 'EUCJP', label: 'EUC-JP' },
];

const DELIMITER_OPTIONS: { value: DelimiterOption; label: string }[] = [
  { value: 'comma', label: 'カンマ ( , )' },
  { value: 'tab', label: 'タブ' },
];

const MODE_OPTIONS: { value: ImportMode; label: string }[] = [
  { value: 'add', label: 'レコードの追加のみ' },
  { value: 'upsert', label: 'レコードの更新と追加' },
  { value: 'update', label: 'レコードの更新のみ' },
];

const ERROR_BEHAVIOR_OPTIONS: { value: ErrorBehavior; label: string }[] = [
  { value: 'abort', label: 'エラーがある場合は取り込みを中断する' },
  { value: 'skip', label: 'エラー行を除いて取り込む' },
];

export const SettingsPanel: FC<SettingsPanelProps> = ({
  settings,
  detectedEncodingLabel,
  updateKeyCandidates,
  headers,
  previewRows,
  mapping,
  importableFields,
  parseError,
  onChange,
  onMappingChange,
  onCancel,
  onConfirm,
}) => {
  const requiresKey = settings.mode === 'update' || settings.mode === 'upsert';
  const hasKeyCandidates = updateKeyCandidates.length > 0;
  const hasMappedColumn = mapping.some((fieldCode) => fieldCode !== '');
  const isConfirmDisabled =
    parseError !== null ||
    !hasMappedColumn ||
    (requiresKey && (!hasKeyCandidates || !settings.updateKeyField));

  const update = <K extends keyof ImportSettings>(key: K, value: ImportSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const footer = (
    <>
      <Button onClick={onCancel}>キャンセル</Button>
      <Button variant='contained' onClick={onConfirm} disabled={isConfirmDisabled}>
        次へ
      </Button>
    </>
  );

  return (
    <DrawerLayout title='CSVインポート設定' footer={footer}>
      <Stack spacing={3}>
        <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <FormLabel sx={{ mb: 1 }}>文字コード</FormLabel>
            <Select
              value={settings.encoding}
              onChange={(event) => update('encoding', event.target.value as EncodingOption)}
            >
              {ENCODING_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                  {option.value === 'AUTO' && detectedEncodingLabel
                    ? `（検出: ${detectedEncodingLabel}）`
                    : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 180 }}>
            <FormLabel sx={{ mb: 1 }}>区切り文字</FormLabel>
            <Select
              value={settings.delimiter}
              onChange={(event) => update('delimiter', event.target.value as DelimiterOption)}
            >
              {DELIMITER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction='row' spacing={4} flexWrap='wrap' useFlexGap>
          <FormControl>
            <FormLabel>インポート方法</FormLabel>
            <RadioGroup
              value={settings.mode}
              onChange={(event) => update('mode', event.target.value as ImportMode)}
            >
              {MODE_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size='small' />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel>エラー発生時の挙動</FormLabel>
            <RadioGroup
              value={settings.errorBehavior}
              onChange={(event) => update('errorBehavior', event.target.value as ErrorBehavior)}
            >
              {ERROR_BEHAVIOR_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size='small' />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {requiresKey && (
            <FormControl size='small' sx={{ minWidth: 240, alignSelf: 'flex-start' }}>
              <FormLabel sx={{ mb: 1 }}>更新のキーフィールド</FormLabel>
              {hasKeyCandidates ? (
                <Select
                  value={settings.updateKeyField}
                  displayEmpty
                  onChange={(event) => update('updateKeyField', event.target.value)}
                >
                  <MenuItem value=''>
                    <Typography color='text.secondary'>選択してください</Typography>
                  </MenuItem>
                  {updateKeyCandidates.map((candidate) => (
                    <MenuItem key={candidate.code} value={candidate.code}>
                      {candidate.label}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Alert severity='warning' sx={{ maxWidth: 360 }}>
                  更新キーに使えるフィールド（レコード番号・重複禁止フィールド）が割り当てられていません。
                </Alert>
              )}
            </FormControl>
          )}
        </Stack>

        <Divider />

        <div>
          <Typography variant='subtitle1' sx={{ mb: 1 }}>
            取り込み項目のマッピングとプレビュー
          </Typography>
          {parseError ? (
            <Alert severity='error'>{parseError}</Alert>
          ) : (
            <MappingPreviewTable
              headers={headers}
              previewRows={previewRows}
              mapping={mapping}
              importableFields={importableFields}
              onMappingChange={onMappingChange}
            />
          )}
        </div>
      </Stack>
    </DrawerLayout>
  );
};
