import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import { findMissingRequiredFieldCodes } from './required-fields';

const field = (code: string, type: string, required: boolean): kintoneAPI.FieldProperty =>
  ({ code, type, label: code, required }) as unknown as kintoneAPI.FieldProperty;

const fields = [
  field('必須テキスト', 'SINGLE_LINE_TEXT', true),
  field('任意テキスト', 'SINGLE_LINE_TEXT', false),
  field('必須数値', 'NUMBER', true),
  field('必須ユーザー', 'USER_SELECT', true),
  field('計算', 'CALC', true),
  field('レコード番号', 'RECORD_NUMBER', true),
];

const record = (values: Record<string, kintoneAPI.RecordData[string]>) =>
  values as kintoneAPI.RecordData;

describe('findMissingRequiredFieldCodes', () => {
  test('未入力の必須フィールドを返す', () => {
    const result = findMissingRequiredFieldCodes({
      fields,
      record: record({
        必須テキスト: { type: 'SINGLE_LINE_TEXT', value: '' },
        任意テキスト: { type: 'SINGLE_LINE_TEXT', value: '' },
        必須数値: { type: 'NUMBER', value: '10' },
        必須ユーザー: { type: 'USER_SELECT', value: [{ code: 'taro', name: '太郎' }] },
      }),
    });

    expect(result).toEqual(['必須テキスト']);
  });

  test('空白のみの入力は未入力として扱う', () => {
    const result = findMissingRequiredFieldCodes({
      fields,
      record: record({ 必須テキスト: { type: 'SINGLE_LINE_TEXT', value: '   ' } }),
    });

    expect(result).toEqual(['必須テキスト']);
  });

  test('数値の0は入力済みとして扱う', () => {
    const result = findMissingRequiredFieldCodes({
      fields,
      record: record({
        必須テキスト: { type: 'SINGLE_LINE_TEXT', value: 'x' },
        必須数値: { type: 'NUMBER', value: '0' },
      }),
    });

    expect(result).toEqual([]);
  });

  test('未選択のユーザー選択は未入力として扱う', () => {
    const result = findMissingRequiredFieldCodes({
      fields,
      record: record({
        必須テキスト: { type: 'SINGLE_LINE_TEXT', value: 'x' },
        必須ユーザー: { type: 'USER_SELECT', value: [] },
      }),
    });

    expect(result).toEqual(['必須ユーザー']);
  });

  test('自動で値が入るフィールドは対象外', () => {
    const result = findMissingRequiredFieldCodes({
      fields,
      record: record({
        必須テキスト: { type: 'SINGLE_LINE_TEXT', value: 'x' },
        計算: { type: 'CALC', value: '' },
        レコード番号: { type: 'RECORD_NUMBER', value: '' },
      }),
    });

    expect(result).toEqual([]);
  });

  test('レコードが無い場合は空配列を返す', () => {
    expect(findMissingRequiredFieldCodes({ fields, record: null })).toEqual([]);
  });
});
