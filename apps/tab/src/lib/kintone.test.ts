import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import {
  getLabelKey,
  getLayoutHrElementIds,
  getLayoutHrs,
  getLayoutLabelKeys,
  getLayoutLabels,
  getLayoutSpacers,
} from './kintone';

/** テスト環境にはDOMParserが無いため、タグを取り除くだけの簡易な実装で代用する */
const parseLabelText = (label: string) => label.replace(/<[^>]*>/g, '').trim();

const label = (text: string, elementId?: string) =>
  ({ type: 'LABEL', label: text, ...(elementId ? { elementId } : {}) }) as kintoneAPI.LayoutField;
const hr = (elementId?: string) =>
  ({ type: 'HR', ...(elementId ? { elementId } : {}) }) as kintoneAPI.LayoutField;
const spacer = (elementId: string) => ({ type: 'SPACER', elementId }) as kintoneAPI.LayoutField;
const row = (...fields: kintoneAPI.LayoutField[]) =>
  ({ type: 'ROW', fields }) as kintoneAPI.Layout[number];

const layout: kintoneAPI.Layout = [
  row(label('<b>基本情報</b>'), hr(), spacer('summary')),
  row(label('', 'notice'), label('   '), hr('line'), spacer('')),
  {
    type: 'GROUP',
    code: '請求先',
    layout: [row(label('請求先'), hr())],
  } as kintoneAPI.Layout[number],
];

describe('getLayoutLabels', () => {
  test('グループ内も含め、レイアウト順にラベルを取り出す', () => {
    expect(getLayoutLabels(layout, parseLabelText)).toStrictEqual([
      { elementId: '', text: '基本情報' },
      { elementId: 'notice', text: '' },
      { elementId: '', text: '' },
      { elementId: '', text: '請求先' },
    ]);
  });
});

describe('getLabelKey', () => {
  test('要素IDがあれば要素IDを、無ければ文言をキーとする', () => {
    expect(getLabelKey({ elementId: 'notice', text: 'お知らせ' })).toBe('notice');
    expect(getLabelKey({ elementId: '', text: 'お知らせ' })).toBe('お知らせ');
    expect(getLabelKey({ elementId: '', text: '' })).toBe('');
  });
});

describe('getLayoutLabelKeys', () => {
  test('キーを持たないラベルを除き、重複なく取り出す', () => {
    expect(getLayoutLabelKeys(layout, parseLabelText)).toStrictEqual([
      '基本情報',
      'notice',
      '請求先',
    ]);
  });
});

describe('getLayoutHrs', () => {
  test('要素IDを持たない罫線も含め、レイアウト順に取り出す', () => {
    expect(getLayoutHrs(layout)).toStrictEqual([
      { elementId: '' },
      { elementId: 'line' },
      { elementId: '' },
    ]);
  });

  test('要素IDを持つ罫線だけを取り出せる', () => {
    expect(getLayoutHrElementIds(layout)).toStrictEqual(['line']);
  });
});

describe('getLayoutSpacers', () => {
  test('要素IDを持たないスペースは対象外とする', () => {
    expect(getLayoutSpacers(layout).map((spacer) => spacer.elementId)).toStrictEqual(['summary']);
  });
});
