import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import {
  MAX_FIELD_OPTIONS,
  summarizeFormFields,
  summarizeLayout,
  summarizeViews,
} from './app-schema';

const properties = {
  金額: { type: 'NUMBER', code: '金額', label: '金額', required: true, unit: '円' },
  状態: {
    type: 'DROP_DOWN',
    code: '状態',
    label: '状態',
    required: false,
    options: Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [`v${i}`, { label: `v${i}`, index: String(24 - i) }])
    ),
  },
  明細: {
    type: 'SUBTABLE',
    code: '明細',
    label: '明細',
    fields: { 品名: { type: 'SINGLE_LINE_TEXT', code: '品名', label: '品名', required: false } },
  },
} as unknown as Record<string, kintoneAPI.FieldProperty>;

describe('summarizeFormFields', () => {
  test('コード・ラベル・型・必須・単位を残し、選択肢は表示順で20件までにする', () => {
    const fields = summarizeFormFields(properties, { includeSubtable: true });
    expect(fields[0]).toEqual({
      code: '金額',
      label: '金額',
      type: 'NUMBER',
      required: true,
      unit: '円',
    });
    expect(fields[1]?.options).toHaveLength(MAX_FIELD_OPTIONS);
    expect(fields[1]?.options?.[0]).toBe('v24');
    expect(fields[1]?.optionCount).toBe(25);
    expect(fields.at(-1)).toEqual({
      code: '品名',
      label: '品名',
      type: 'SINGLE_LINE_TEXT',
      subtableCode: '明細',
    });
  });

  test('テーブル内のフィールドを含めない指定', () => {
    const fields = summarizeFormFields(properties, { includeSubtable: false });
    expect(fields.map((field) => field.code)).toEqual(['金額', '状態', '明細']);
  });
});

describe('summarizeLayout', () => {
  test('行・グループ・テーブルの入れ子と、スペースの要素ID・ラベルの文字を残す', () => {
    const layout = [
      {
        type: 'ROW',
        fields: [
          { type: 'SPACER', elementId: 'sp1', size: {} },
          { type: 'LABEL', label: '<div><b>注意</b>: 必ず入力</div>', size: {} },
          { type: 'NUMBER', code: '金額', size: {} },
        ],
      },
      { type: 'GROUP', code: 'g', layout: [{ type: 'ROW', fields: [{ type: 'HR', size: {} }] }] },
      { type: 'SUBTABLE', code: '明細', fields: [{ type: 'SINGLE_LINE_TEXT', code: '品名' }] },
    ] as unknown as kintoneAPI.Layout;
    expect(summarizeLayout(layout)).toEqual([
      {
        type: 'ROW',
        fields: [
          { type: 'SPACER', elementId: 'sp1' },
          { type: 'LABEL', label: '注意 : 必ず入力' },
          { type: 'NUMBER', code: '金額' },
        ],
      },
      { type: 'GROUP', code: 'g', rows: [{ type: 'ROW', fields: [{ type: 'HR' }] }] },
      { type: 'SUBTABLE', code: '明細', fields: [{ type: 'SINGLE_LINE_TEXT', code: '品名' }] },
    ]);
  });
});

describe('summarizeViews', () => {
  test('表示順に並べ、カスタマイズビューのHTMLは渡さない', () => {
    const views = {
      b: {
        index: '1',
        id: '2',
        name: 'カスタム',
        type: 'CUSTOM',
        html: '<div>x</div>',
        pager: true,
        device: 'ANY',
        filterCond: '',
        sort: '',
      },
      a: {
        index: '0',
        id: '1',
        name: '一覧',
        type: 'LIST',
        fields: ['金額'],
        filterCond: '金額 > 0',
        sort: 'レコード番号 desc',
      },
    } as unknown as Record<string, kintoneAPI.view.Response>;
    expect(summarizeViews(views)).toEqual([
      {
        id: '1',
        name: '一覧',
        type: 'LIST',
        fields: ['金額'],
        filterCond: '金額 > 0',
        sort: 'レコード番号 desc',
      },
      { id: '2', name: 'カスタム', type: 'CUSTOM', filterCond: '', sort: '' },
    ]);
  });
});
