import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test, vi } from 'vitest';
import type { PluginCondition } from '../schema/plugin-config';
import {
  buildFlatTableRows,
  calculateFieldAggregations,
  createSubtableMatchingRowFilter,
  createSubtableRelatedQueryConditionsRowFilter,
  createTableColumnKey,
  extractColumnFilterOptions,
  FIELD_AGGREGATION_OPERATIONS,
  filterFlatTableRows,
  getRowSpanByGroup,
  isAggregatableField,
  isColumnFilterActive,
  isFirstVisibleRowInGroup,
  paginateFlatTableRowsByRecord,
  resolveRelatedRecordFields,
  resolveSubtableFields,
  shouldMergeRelatedRecordFields,
} from './table';

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

const condition: PluginCondition = {
  id: 'condition-1',
  memo: '',
  targetSpaceId: 'space',
  relatedAppId: '10',
  currentAppFieldCode: 'currentKey',
  relatedAppFieldCode: 'relatedKey',
  relatedQueryConditions: [
    {
      id: 'query-condition-1',
      type: 'equal',
      currentAppFieldCode: 'currentKey',
      relatedAppFieldCode: 'relatedKey',
    },
  ],
  relatedFilterConditions: [],
  relatedSubtableCode: 'items',
  relatedRecordFieldCodes: ['customer', 'status'],
  subtableFieldCodes: ['product', 'amount'],
  mergeRelatedRecordFields: true,
  filterSubtableRowsByMatchingField: false,
  showFieldAggregations: false,
  recordsPerPage: 20,
  aggregationRoundingMode: 'round',
  aggregationDecimalDigits: 10,
  sortFieldCode: '$id',
  sortOrder: 'asc',
};

const field = (value: string): kintoneAPI.Field =>
  ({ type: 'SINGLE_LINE_TEXT', value }) as kintoneAPI.Field;

const subtable = (rows: Record<string, string>[]): kintoneAPI.field.Subtable =>
  ({
    type: 'SUBTABLE',
    value: rows.map((row, rowIndex) => ({
      id: `row-${rowIndex + 1}`,
      value: Object.fromEntries(
        Object.entries(row).map(([fieldCode, value]) => [fieldCode, field(value)])
      ),
    })),
  }) as kintoneAPI.field.Subtable;

const relatedFields = {
  customer: { code: 'customer', label: '顧客', type: 'SINGLE_LINE_TEXT' },
  status: { code: 'status', label: '状態', type: 'SINGLE_LINE_TEXT' },
  budget: { code: 'budget', label: '予算', type: 'NUMBER' },
  ignored: { code: 'ignored', label: '未使用', type: 'SINGLE_LINE_TEXT' },
  items: {
    code: 'items',
    label: '明細',
    type: 'SUBTABLE',
    fields: {
      product: { code: 'product', label: '商品', type: 'SINGLE_LINE_TEXT' },
      amount: { code: 'amount', label: '金額', type: 'NUMBER' },
      calculated: { code: 'calculated', label: '税込金額', type: 'CALC' },
    },
  },
} as unknown as kintoneAPI.FieldProperties;

const records = [
  {
    $id: { type: '__ID__', value: '101' },
    customer: field('青山商事'),
    status: field('受注'),
    budget: field('300000'),
    items: subtable([
      { product: 'ノートPC', amount: '120000', calculated: '132000' },
      { product: '保守費', amount: '24000', calculated: '26400' },
    ]),
  },
  {
    $id: { type: '__ID__', value: '102' },
    customer: field('東京工業'),
    status: field('見積'),
    budget: field('150000'),
    items: subtable([{ product: 'プリンター', amount: '45000', calculated: '49500' }]),
  },
] as kintoneAPI.RecordData[];

describe('reference table helpers', () => {
  test('関連レコードとサブテーブル行を1つのテーブル行配列に展開する', () => {
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, condition);
    const subtableFields = resolveSubtableFields(relatedFields, condition);

    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields,
      subtableFields,
    });

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.groupKey)).toEqual(['record-101', 'record-101', 'record-102']);
    expect(rows.map((row) => row.subtableRowIndex)).toEqual([0, 1, 0]);
  });

  test('サブテーブルを設定しない場合は関連レコードを1レコード1行で展開する', () => {
    const noSubtableCondition: PluginCondition = {
      ...condition,
      relatedSubtableCode: '',
      relatedRecordFieldCodes: ['customer', 'status'],
      subtableFieldCodes: [],
    };
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, noSubtableCondition);
    const subtableFields = resolveSubtableFields(relatedFields, noSubtableCondition);

    const rows = buildFlatTableRows({
      records,
      condition: noSubtableCondition,
      relatedRecordFields,
      subtableFields,
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.groupKey)).toEqual(['record-101', 'record-102']);
    expect(rows.map((row) => row.subtableRow)).toEqual([undefined, undefined]);
    expect(filterFlatTableRows(rows, '東京')).toHaveLength(1);
  });

  test('サブテーブルを選択していても表示列が空の場合は関連レコードを1レコード1行で展開する', () => {
    const recordOnlyCondition: PluginCondition = {
      ...condition,
      relatedRecordFieldCodes: ['customer'],
      subtableFieldCodes: [],
    };

    const rows = buildFlatTableRows({
      records,
      condition: recordOnlyCondition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, recordOnlyCondition),
      subtableFields: resolveSubtableFields(relatedFields, recordOnlyCondition),
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.groupKey)).toEqual(['record-101', 'record-102']);
  });

  test('サブテーブル列を表示する場合、空のサブテーブルを持つ関連レコードは行を生成しない', () => {
    const rows = buildFlatTableRows({
      records: [
        {
          $id: { type: '__ID__', value: '103' },
          customer: field('空テーブル'),
          items: subtable([]),
        },
      ] as kintoneAPI.RecordData[],
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    expect(rows).toHaveLength(0);
  });

  test('一度に表示するレコード数はサブテーブル展開後も関連レコード単位で適用する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const firstPageRows = paginateFlatTableRowsByRecord({ rows, page: 1, recordsPerPage: 1 });
    const secondPageRows = paginateFlatTableRowsByRecord({ rows, page: 2, recordsPerPage: 1 });
    const invalidPageSizeRows = paginateFlatTableRowsByRecord({
      rows,
      page: 1,
      recordsPerPage: 0,
    });

    expect(firstPageRows).toHaveLength(2);
    expect(firstPageRows.every((row) => row.groupKey === 'record-101')).toBe(true);
    expect(secondPageRows).toHaveLength(1);
    expect(secondPageRows[0]?.groupKey).toBe('record-102');
    expect(invalidPageSizeRows.map((row) => row.groupKey)).toEqual(['record-101', 'record-101']);
  });

  test('親側フィールドで検索すると同じ関連レコードのサブテーブル行がすべて残る', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const filtered = filterFlatTableRows(rows, '青山');

    expect(filtered).toHaveLength(2);
    expect(filtered.every((row) => row.groupKey === 'record-101')).toBe(true);
  });

  test('サブテーブル内フィールドで検索した行数に合わせてrowspanを再計算する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const filtered = filterFlatTableRows(rows, '保守費');
    const rowSpanByGroup = getRowSpanByGroup(filtered);

    expect(filtered).toHaveLength(1);
    expect(rowSpanByGroup.get('record-101')).toBe(1);
    expect(isFirstVisibleRowInGroup(filtered, 0)).toBe(true);
  });

  test('関連レコードのフィールドを結合するか判定する', () => {
    expect(shouldMergeRelatedRecordFields(condition)).toBe(true);
    expect(shouldMergeRelatedRecordFields({ ...condition, mergeRelatedRecordFields: false })).toBe(
      false
    );
  });

  test('指定した照合値に一致するサブテーブル行だけを展開する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
      subtableRowFilter: createSubtableMatchingRowFilter({
        fieldCode: 'product',
        matchingValues: ['保守費', 'プリンター'],
      }),
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.groupKey)).toEqual(['record-101', 'record-102']);
    expect(rows.map((row) => row.subtableRowIndex)).toEqual([1, 0]);
  });

  test('複数の取得条件に一致するサブテーブル行だけを展開する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
      subtableRowFilter: createSubtableRelatedQueryConditionsRowFilter({
        conditions: [
          {
            fieldCode: 'product',
            fieldType: 'SINGLE_LINE_TEXT',
            type: 'include',
            matchingValues: ['保守'],
          },
          {
            fieldCode: 'amount',
            fieldType: 'NUMBER',
            type: 'greaterOrEqual',
            matchingValues: ['20000'],
          },
        ],
      }),
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.groupKey).toBe('record-101');
    expect(rows[0]?.subtableRowIndex).toBe(1);
  });

  test('追加取得したレコードの行インデックスに取得済み件数を反映する', () => {
    const recordsWithoutId = [
      {
        customer: field('追加レコード'),
        status: field('受注'),
        items: subtable([{ product: '追加明細', amount: '1000' }]),
      },
    ] as kintoneAPI.RecordData[];

    const rows = buildFlatTableRows({
      records: recordsWithoutId,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
      recordIndexOffset: 500,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.recordIndex).toBe(500);
    expect(rows[0]?.groupKey).toBe('record-500');
  });

  test('照合値が空の場合はサブテーブル行を表示しない', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
      subtableRowFilter: createSubtableMatchingRowFilter({
        fieldCode: 'product',
        matchingValues: [],
      }),
    });

    expect(rows).toHaveLength(0);
  });

  test('数値フィールドと計算フィールドだけを集計対象として判定する', () => {
    expect(isAggregatableField({ code: 'amount', label: '金額', type: 'NUMBER' })).toBe(true);
    expect(isAggregatableField({ code: 'calculated', label: '税込金額', type: 'CALC' })).toBe(true);
    expect(isAggregatableField({ code: 'product', label: '商品', type: 'SINGLE_LINE_TEXT' })).toBe(
      false
    );
  });

  test('集計方法の候補に件数を含めない', () => {
    expect(FIELD_AGGREGATION_OPERATIONS).toEqual(['sum', 'average', 'max', 'min']);
  });

  test('表示行の数値フィールドと計算フィールドを合計する', () => {
    const aggregationCondition: PluginCondition = {
      ...condition,
      relatedRecordFieldCodes: ['budget'],
      subtableFieldCodes: ['product', 'amount', 'calculated'],
    };
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, aggregationCondition);
    const subtableFields = resolveSubtableFields(relatedFields, aggregationCondition);
    const rows = buildFlatTableRows({
      records,
      condition: aggregationCondition,
      relatedRecordFields,
      subtableFields,
    });

    const aggregations = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields,
    });

    expect(aggregations).toEqual([
      {
        key: 'record:budget',
        fieldCode: 'budget',
        label: '予算',
        source: 'record',
        operation: 'sum',
        value: 450000,
        formattedValue: '450,000',
        count: 2,
      },
      {
        key: 'subtable:amount',
        fieldCode: 'amount',
        label: '金額',
        source: 'subtable',
        operation: 'sum',
        value: 189000,
        formattedValue: '189,000',
        count: 3,
      },
      {
        key: 'subtable:calculated',
        fieldCode: 'calculated',
        label: '税込金額',
        source: 'subtable',
        operation: 'sum',
        value: 207900,
        formattedValue: '207,900',
        count: 3,
      },
    ]);
  });

  test('集計方法を平均・最大・最小に切り替えられる', () => {
    const aggregationCondition: PluginCondition = {
      ...condition,
      relatedRecordFieldCodes: ['budget'],
      subtableFieldCodes: ['amount'],
    };
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, aggregationCondition);
    const subtableFields = resolveSubtableFields(relatedFields, aggregationCondition);
    const rows = buildFlatTableRows({
      records,
      condition: aggregationCondition,
      relatedRecordFields,
      subtableFields,
    });

    const average = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields,
      operation: 'average',
    });
    const max = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields,
      operation: 'max',
    });
    const min = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields,
      operation: 'min',
    });

    expect(average.map((aggregation) => aggregation.value)).toEqual([225000, 63000]);
    expect(max.map((aggregation) => aggregation.value)).toEqual([300000, 120000]);
    expect(min.map((aggregation) => aggregation.value)).toEqual([150000, 24000]);
  });

  test('集計値の端数処理と小数点以下表示桁数を指定できる', () => {
    const aggregationCondition: PluginCondition = {
      ...condition,
      relatedSubtableCode: '',
      relatedRecordFieldCodes: ['budget'],
      subtableFieldCodes: [],
    };
    const decimalRecords = [
      { $id: { type: '__ID__', value: '201' }, budget: field('10.15') },
      { $id: { type: '__ID__', value: '202' }, budget: field('10.15') },
    ] as kintoneAPI.RecordData[];
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, aggregationCondition);
    const rows = buildFlatTableRows({
      records: decimalRecords,
      condition: aggregationCondition,
      relatedRecordFields,
      subtableFields: [],
    });

    const rounded = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields: [],
      operation: 'average',
      roundingMode: 'round',
      decimalDigits: 1,
    });
    const roundedUp = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields: [],
      operation: 'average',
      roundingMode: 'ceil',
      decimalDigits: 1,
    });
    const roundedDown = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields: [],
      operation: 'average',
      roundingMode: 'floor',
      decimalDigits: 1,
    });

    expect(rounded[0]).toMatchObject({ value: 10.2, formattedValue: '10.2' });
    expect(roundedUp[0]).toMatchObject({ value: 10.2, formattedValue: '10.2' });
    expect(roundedDown[0]).toMatchObject({ value: 10.1, formattedValue: '10.1' });
  });

  test('フィールド単位のフリーワード絞り込みを既存検索とAND条件で適用する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const filtered = filterFlatTableRows(
      rows,
      '青山',
      new Map([[createTableColumnKey('subtable', 'product'), { keyword: '保守' }]])
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.subtableRowIndex).toBe(1);
  });

  test('フィールド単位の個別チェック絞り込みを完全一致で適用する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const filtered = filterFlatTableRows(
      rows,
      '',
      new Map([[createTableColumnKey('record', 'status'), { selectedValues: ['見積'] }]])
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.groupKey).toBe('record-102');
  });

  test('フィールド単位のフリーワードと個別チェックを同時に適用する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const filtered = filterFlatTableRows(
      rows,
      '青山',
      new Map([
        [
          createTableColumnKey('subtable', 'product'),
          { keyword: '保', selectedValues: ['保守費'] },
        ],
      ])
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.subtableRowIndex).toBe(1);
  });

  test('空のキーワードと未指定の選択値は非アクティブとして扱う', () => {
    expect(isColumnFilterActive(undefined)).toBe(false);
    expect(isColumnFilterActive({ keyword: '   ' })).toBe(false);
    expect(isColumnFilterActive({ selectedValues: [] })).toBe(true);
  });

  test('フィールド単位の絞り込み候補を表示中の行から重複なく抽出する', () => {
    const rows = buildFlatTableRows({
      records,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const options = extractColumnFilterOptions(rows, {
      key: createTableColumnKey('subtable', 'product'),
      fieldCode: 'product',
      source: 'subtable',
    });

    expect(options).toEqual([
      { value: 'ノートPC', label: 'ノートPC', count: 1 },
      { value: 'プリンター', label: 'プリンター', count: 1 },
      { value: '保守費', label: '保守費', count: 1 },
    ]);
  });

  test('空白値をフィルタ候補として表示用ラベル付きで抽出する', () => {
    const emptyRecords = [
      {
        $id: { type: '__ID__', value: '103' },
        customer: field('空白テスト'),
        status: field('受注'),
        items: subtable([{ product: '', amount: '' }]),
      },
    ] as kintoneAPI.RecordData[];
    const rows = buildFlatTableRows({
      records: emptyRecords,
      condition,
      relatedRecordFields: resolveRelatedRecordFields(relatedFields, condition),
      subtableFields: resolveSubtableFields(relatedFields, condition),
    });

    const options = extractColumnFilterOptions(rows, {
      key: createTableColumnKey('subtable', 'product'),
      fieldCode: 'product',
      source: 'subtable',
    });

    expect(options).toContainEqual({ value: '', label: '（空白）', count: 1 });
  });

  test('有効な数値がない場合も集計値は0として返す', () => {
    const aggregationCondition: PluginCondition = {
      ...condition,
      relatedRecordFieldCodes: [],
      subtableFieldCodes: ['amount'],
    };
    const emptyRecords = [
      {
        $id: { type: '__ID__', value: '103' },
        items: subtable([{ amount: '' }]),
      },
    ] as kintoneAPI.RecordData[];
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, aggregationCondition);
    const subtableFields = resolveSubtableFields(relatedFields, aggregationCondition);
    const rows = buildFlatTableRows({
      records: emptyRecords,
      condition: aggregationCondition,
      relatedRecordFields,
      subtableFields,
    });

    const [aggregation] = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields,
      operation: 'average',
    });

    expect(aggregation).toMatchObject({ value: 0, formattedValue: '0', count: 0 });
  });

  test('集計では無効な数値を除外して有効な値だけを扱う', () => {
    const aggregationCondition: PluginCondition = {
      ...condition,
      relatedSubtableCode: '',
      relatedRecordFieldCodes: ['budget'],
      subtableFieldCodes: [],
    };
    const mixedRecords = [
      { $id: { type: '__ID__', value: '301' }, budget: field('100') },
      { $id: { type: '__ID__', value: '302' }, budget: field('Infinity') },
      { $id: { type: '__ID__', value: '303' }, budget: field('not-number') },
    ] as kintoneAPI.RecordData[];
    const relatedRecordFields = resolveRelatedRecordFields(relatedFields, aggregationCondition);
    const rows = buildFlatTableRows({
      records: mixedRecords,
      condition: aggregationCondition,
      relatedRecordFields,
      subtableFields: [],
    });

    const [aggregation] = calculateFieldAggregations({
      rows,
      relatedRecordFields,
      subtableFields: [],
      operation: 'sum',
    });

    expect(aggregation).toMatchObject({ value: 100, formattedValue: '100', count: 1 });
  });
});
