import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test, vi } from 'vitest';
import { buildCsvContent, buildCsvFilename, escapeCsvField } from './csv-export';
import type { FlatTableRow, TableFieldColumn } from './table';

vi.mock('@konomi-app/kintone-utilities', () => ({
  getFieldValueAsString: (field: kintoneAPI.Field | undefined) => {
    if (!field) {
      return '';
    }
    if (Array.isArray(field.value)) {
      return field.value.join(', ');
    }
    return String(field.value ?? '');
  },
}));

const field = (value: string): kintoneAPI.Field =>
  ({ type: 'SINGLE_LINE_TEXT', value }) as kintoneAPI.Field;

const column = (
  source: 'record' | 'subtable',
  fieldCode: string,
  label: string
): TableFieldColumn => ({
  key: `${source}:${fieldCode}`,
  fieldCode,
  label,
  source,
  type: 'SINGLE_LINE_TEXT',
});

const flatRow = (params: {
  id: string;
  record: Record<string, kintoneAPI.Field>;
  subtableRow?: Record<string, kintoneAPI.Field>;
}): FlatTableRow =>
  ({
    id: params.id,
    groupKey: params.id,
    record: params.record,
    recordIndex: 0,
    subtableRow: params.subtableRow ? { id: 'sub-1', value: params.subtableRow } : undefined,
    subtableRowIndex: 0,
    searchText: '',
  }) as unknown as FlatTableRow;

describe('escapeCsvField', () => {
  test('カンマ・ダブルクォート・改行を含まない値はそのまま返す', () => {
    expect(escapeCsvField('青山商事')).toBe('青山商事');
  });

  test('カンマを含む値はダブルクォートで囲む', () => {
    expect(escapeCsvField('東京都, 渋谷区')).toBe('"東京都, 渋谷区"');
  });

  test('ダブルクォートを含む値は二重化して囲む', () => {
    expect(escapeCsvField('「見積」中')).not.toContain('""');
    expect(escapeCsvField('"見積"')).toBe('"""見積"""');
  });

  test('改行を含む値はダブルクォートで囲む', () => {
    expect(escapeCsvField('1行目\n2行目')).toBe('"1行目\n2行目"');
  });

  test('空文字はそのまま返す', () => {
    expect(escapeCsvField('')).toBe('');
  });
});

describe('buildCsvContent', () => {
  test('列見出しと行データをCRLF区切りのCSVとして組み立てる', () => {
    const columns = [column('record', 'customer', '顧客'), column('record', 'status', '状態')];
    const rows = [
      flatRow({
        id: '1',
        record: { customer: field('青山商事'), status: field('受注') },
      }),
      flatRow({
        id: '2',
        record: { customer: field('東京工業'), status: field('見積') },
      }),
    ];

    const content = buildCsvContent({ columns, rows });

    expect(content).toBe('顧客,状態\r\n青山商事,受注\r\n東京工業,見積');
  });

  test('カンマを含む値はセル単位でエスケープされる', () => {
    const columns = [column('record', 'address', '住所')];
    const rows = [flatRow({ id: '1', record: { address: field('東京都, 渋谷区') } })];

    const content = buildCsvContent({ columns, rows });

    expect(content).toBe('住所\r\n"東京都, 渋谷区"');
  });

  test('サブテーブル列は subtableRow の値を参照する', () => {
    const columns = [column('subtable', 'product', '商品')];
    const rows = [
      flatRow({
        id: '1',
        record: {},
        subtableRow: { product: field('ノートPC') },
      }),
    ];

    const content = buildCsvContent({ columns, rows });

    expect(content).toBe('商品\r\nノートPC');
  });

  test('行が0件でも見出し行のみのCSVを返す', () => {
    const columns = [column('record', 'customer', '顧客')];

    const content = buildCsvContent({ columns, rows: [] });

    expect(content).toBe('顧客');
  });

  test('値が空のセルは空文字として出力する', () => {
    const columns = [column('record', 'customer', '顧客')];
    const rows = [flatRow({ id: '1', record: {} })];

    const content = buildCsvContent({ columns, rows });

    expect(content).toBe('顧客\r\n');
  });
});

describe('buildCsvFilename', () => {
  test('ベース名とタイムスタンプからファイル名を組み立てる', () => {
    const filename = buildCsvFilename({
      baseName: '案件一覧',
      now: new Date(2026, 5, 30, 9, 5, 3),
    });

    expect(filename).toBe('案件一覧-20260630-090503.csv');
  });

  test('ファイル名に使えない記号は置換する', () => {
    const filename = buildCsvFilename({
      baseName: '案件/一覧:テスト',
      now: new Date(2026, 0, 1, 0, 0, 0),
    });

    expect(filename).toBe('案件_一覧_テスト-20260101-000000.csv');
  });

  test('ベース名が空の場合は既定の名前を使う', () => {
    const filename = buildCsvFilename({ baseName: '   ', now: new Date(2026, 0, 1, 0, 0, 0) });

    expect(filename).toBe('関連レコード-20260101-000000.csv');
  });
});
