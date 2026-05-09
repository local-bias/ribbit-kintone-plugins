import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  createRelatedRecordsQuery,
  createRelatedRecordsQueryFromConditions,
  getRecordUrl,
  quoteFieldCode,
} from './kintone';

vi.mock('./global', () => ({
  GUEST_SPACE_ID: undefined,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createRelatedRecordsQuery', () => {
  test('通常フィールドの単一値は等価条件を生成する', () => {
    const query = createRelatedRecordsQuery({
      fieldCode: 'customerCode',
      fieldType: 'SINGLE_LINE_TEXT',
      value: 'C-001',
      sortFieldCode: '$id',
      sortOrder: 'asc',
    });

    expect(query).toBe('customerCode = "C-001" order by $id asc');
  });

  test('通常フィールドでも複数値はin条件を生成する', () => {
    const query = createRelatedRecordsQuery({
      fieldCode: 'customerCode',
      fieldType: 'SINGLE_LINE_TEXT',
      value: ['C-001', 'C-002'],
      sortFieldCode: '$id',
      sortOrder: 'desc',
    });

    expect(query).toBe('customerCode in ("C-001", "C-002") order by $id desc');
  });

  test('サブテーブル内フィールドの単一値はin条件を生成する', () => {
    const query = createRelatedRecordsQuery({
      fieldCode: 'customerCodeInTable',
      fieldType: 'SINGLE_LINE_TEXT',
      value: 'C-001',
      sortFieldCode: '$id',
      sortOrder: 'asc',
      forceInOperator: true,
    });

    expect(query).toBe('customerCodeInTable in ("C-001") order by $id asc');
  });

  test('サブテーブル内の数値フィールドは数値のin条件を生成する', () => {
    const query = createRelatedRecordsQuery({
      fieldCode: 'amountInTable',
      fieldType: 'NUMBER',
      value: '1000',
      sortFieldCode: '$id',
      sortOrder: 'asc',
      forceInOperator: true,
    });

    expect(query).toBe('amountInTable in (1000) order by $id asc');
  });

  test('値が空の場合はクエリを生成しない', () => {
    const query = createRelatedRecordsQuery({
      fieldCode: 'customerCode',
      fieldType: 'SINGLE_LINE_TEXT',
      value: '',
      sortFieldCode: '$id',
      sortOrder: 'asc',
    });

    expect(query).toBeNull();
  });

  test('クエリ構文に影響するフィールドコードを拒否する', () => {
    expect(() => quoteFieldCode('customerCode order by $id desc')).toThrow('Invalid field code');
    expect(() => quoteFieldCode('customerCode) or $id != ""')).toThrow('Invalid field code');
    expect(() => quoteFieldCode('customerCode\u200b')).toThrow('Invalid field code');
  });

  test('クエリ構文に影響する並び順を拒否する', () => {
    expect(() =>
      createRelatedRecordsQuery({
        fieldCode: 'customerCode',
        fieldType: 'SINGLE_LINE_TEXT',
        value: 'C-001',
        sortFieldCode: '$id',
        sortOrder: 'asc limit 1' as never,
      })
    ).toThrow('Invalid sort order');
  });

  test('複数の取得条件をAND条件で結合する', () => {
    const query = createRelatedRecordsQueryFromConditions({
      conditions: [
        {
          fieldCode: 'customerCode',
          fieldType: 'SINGLE_LINE_TEXT',
          type: 'equal',
          value: 'C-001',
        },
        {
          fieldCode: 'status',
          fieldType: 'DROP_DOWN',
          type: 'notEqual',
          value: '失注',
        },
      ],
      sortFieldCode: '$id',
      sortOrder: 'asc',
    });

    expect(query).toBe('customerCode = "C-001" and status != "失注" order by $id asc');
  });

  test('文字列の包含条件をlike条件で生成する', () => {
    const query = createRelatedRecordsQueryFromConditions({
      conditions: [
        {
          fieldCode: 'description',
          fieldType: 'MULTI_LINE_TEXT',
          type: 'include',
          value: ['保守', '更新'],
        },
      ],
      sortFieldCode: '$id',
      sortOrder: 'asc',
    });

    expect(query).toBe('(description like "保守" or description like "更新") order by $id asc');
  });

  test('数値と日付の比較条件を生成する', () => {
    const query = createRelatedRecordsQueryFromConditions({
      conditions: [
        {
          fieldCode: 'amount',
          fieldType: 'NUMBER',
          type: 'greaterOrEqual',
          value: '1000',
        },
        {
          fieldCode: 'dueDate',
          fieldType: 'DATE',
          type: 'dateBeforeOrEqual',
          value: '2026-05-31',
        },
      ],
      sortFieldCode: '$id',
      sortOrder: 'desc',
    });

    expect(query).toBe('amount >= 1000 and dueDate <= "2026-05-31" order by $id desc');
  });

  test('サブテーブル内フィールドは一致条件をin条件で生成する', () => {
    const query = createRelatedRecordsQueryFromConditions({
      conditions: [
        {
          fieldCode: 'productCode',
          fieldType: 'SINGLE_LINE_TEXT',
          type: 'equal',
          value: 'P-001',
          forceInOperator: true,
        },
      ],
      sortFieldCode: '$id',
      sortOrder: 'asc',
    });

    expect(query).toBe('productCode in ("P-001") order by $id asc');
  });

  test('空の条件は無視し、有効な条件がない場合はクエリを生成しない', () => {
    expect(
      createRelatedRecordsQueryFromConditions({
        conditions: [
          {
            fieldCode: 'customerCode',
            fieldType: 'SINGLE_LINE_TEXT',
            type: 'equal',
            value: '',
          },
        ],
        sortFieldCode: '$id',
        sortOrder: 'asc',
      })
    ).toBeNull();

    expect(
      createRelatedRecordsQueryFromConditions({
        conditions: [
          {
            fieldCode: 'optional',
            fieldType: 'SINGLE_LINE_TEXT',
            type: 'equal',
            value: '',
          },
          {
            fieldCode: 'customerCode',
            fieldType: 'SINGLE_LINE_TEXT',
            type: 'equal',
            value: 'C-001',
          },
        ],
        sortFieldCode: '$id',
        sortOrder: 'asc',
      })
    ).toBe('customerCode = "C-001" order by $id asc');
  });

  test('サブテーブル内フィールドで利用できない比較方法を拒否する', () => {
    expect(() =>
      createRelatedRecordsQueryFromConditions({
        conditions: [
          {
            fieldCode: 'amountInTable',
            fieldType: 'NUMBER',
            type: 'greater',
            value: '1000',
            forceInOperator: true,
          },
        ],
        sortFieldCode: '$id',
        sortOrder: 'asc',
      })
    ).toThrow('Invalid condition type');
  });

  test('レコードURLのパス要素とハッシュ値をエンコードする', () => {
    vi.stubGlobal('location', { origin: 'https://example.cybozu.com' });

    expect(getRecordUrl('10/../20', '101#bad')).toBe(
      'https://example.cybozu.com/k/10%2F..%2F20/show#record=101%23bad'
    );
  });
});
