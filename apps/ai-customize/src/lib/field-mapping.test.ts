import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import {
  CHOICE_VALUE_MAPPINGS,
  FIELD_MAPPINGS,
  filterFieldsByTypes,
  getDefaultSelectedOptions,
  getFieldOptions,
} from './field-mapping';
import { createCommonConfig } from './plugin';

const field = (properties: Record<string, unknown>) =>
  properties as unknown as kintoneAPI.FieldProperty;

describe('FIELD_MAPPINGS / CHOICE_VALUE_MAPPINGS', () => {
  test('設定の全てのフィールドコードと選択肢の値を網羅する', () => {
    const keys = Object.keys(createCommonConfig());
    expect(FIELD_MAPPINGS.map((mapping) => mapping.key).toSorted()).toEqual(
      keys.filter((key) => key.endsWith('FieldCode')).toSorted()
    );
    expect(CHOICE_VALUE_MAPPINGS.map((mapping) => mapping.key).toSorted()).toEqual(
      keys.filter((key) => key.endsWith('Value')).toSorted()
    );
  });
});

describe('filterFieldsByTypes', () => {
  test('型が合うフィールドだけを返す', () => {
    const fields = [
      field({ code: 'a', type: 'NUMBER' }),
      field({ code: 'b', type: 'SINGLE_LINE_TEXT' }),
      field({ code: 'c', type: 'NUMBER' }),
    ];
    expect(filterFieldsByTypes(fields, ['NUMBER']).map((f) => f.code)).toEqual(['a', 'c']);
  });
});

describe('getFieldOptions', () => {
  test('選択肢を表示順で返す', () => {
    expect(
      getFieldOptions(
        field({
          type: 'DROP_DOWN',
          options: {
            CSS: { label: 'CSS', index: '1' },
            JavaScript: { label: 'JavaScript', index: '0' },
          },
        })
      )
    ).toEqual(['JavaScript', 'CSS']);
  });

  test('選択肢の無いフィールド・未選択は空配列', () => {
    expect(getFieldOptions(field({ type: 'NUMBER' }))).toEqual([]);
    expect(getFieldOptions(undefined)).toEqual([]);
  });
});

describe('getDefaultSelectedOptions', () => {
  test('チェックボックスの初期値を返す', () => {
    expect(
      getDefaultSelectedOptions(field({ type: 'CHECK_BOX', defaultValue: ['更新(PUT)'] }))
    ).toEqual(['更新(PUT)']);
    expect(getDefaultSelectedOptions(field({ type: 'DROP_DOWN', defaultValue: 'x' }))).toEqual([]);
  });
});
