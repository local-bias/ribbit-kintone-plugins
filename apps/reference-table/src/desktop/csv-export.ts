import { type FlatTableRow, getFlatTableRowDisplayValue, type TableFieldColumn } from './table';

const CSV_LINE_BREAK = '\r\n';
/** Excel で開いたときに文字化けしないようにする UTF-8 BOM */
const UTF8_BOM = '\uFEFF';

/**
 * CSV のフィールド値をエスケープする。
 * カンマ・ダブルクォート・改行を含む場合はダブルクォートで囲み、
 * 内部のダブルクォートは2つ重ねてエスケープする（RFC 4180）。
 */
export const escapeCsvField = (value: string): string => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const buildCsvRow = (values: string[]): string => {
  return values.map(escapeCsvField).join(',');
};

export const buildCsvContent = (params: {
  columns: TableFieldColumn[];
  rows: FlatTableRow[];
}): string => {
  const { columns, rows } = params;
  const lines = [
    buildCsvRow(columns.map((column) => column.label)),
    ...rows.map((row) =>
      buildCsvRow(columns.map((column) => getFlatTableRowDisplayValue(row, column)))
    ),
  ];
  return lines.join(CSV_LINE_BREAK);
};

const sanitizeFilenamePart = (value: string): string => {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim();
};

export const buildCsvFilename = (params: { baseName: string; now?: Date }): string => {
  const now = params.now ?? new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const baseName = sanitizeFilenamePart(params.baseName) || '関連レコード';
  return `${baseName}-${timestamp}.csv`;
};

const downloadTextFile = (params: { content: string; filename: string; mimeType: string }) => {
  const blob = new Blob([params.content], { type: params.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = params.filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * 現在の検索・列フィルタ・並び替えを反映した行を CSV としてダウンロードする。
 * ページングは反映せず、絞り込み後の全行を書き出す。
 */
export const exportFlatTableRowsAsCsv = (params: {
  columns: TableFieldColumn[];
  rows: FlatTableRow[];
  baseName: string;
}): void => {
  const content = UTF8_BOM + buildCsvContent({ columns: params.columns, rows: params.rows });
  downloadTextFile({
    content,
    filename: buildCsvFilename({ baseName: params.baseName }),
    mimeType: 'text/csv;charset=utf-8',
  });
};
