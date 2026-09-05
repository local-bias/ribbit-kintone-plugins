import { describe, expect, test } from 'vitest';
import { shouldShow, shouldShowKey, shouldShowLabel } from './visibility';

describe('shouldShow', () => {
  test('`add`は選択された対象のみを表示する', () => {
    expect(shouldShow('add', true)).toBe(true);
    expect(shouldShow('add', false)).toBe(false);
  });

  test('`sub`は選択された対象のみを非表示にする', () => {
    expect(shouldShow('sub', true)).toBe(false);
    expect(shouldShow('sub', false)).toBe(true);
  });
});

describe('shouldShowKey', () => {
  test('`add`では一覧に含まれるキーだけを表示する', () => {
    const params = { displayMode: 'add', selected: ['a', 'b'] } as const;

    expect(shouldShowKey({ ...params, key: 'a' })).toBe(true);
    expect(shouldShowKey({ ...params, key: 'c' })).toBe(false);
  });

  test('`sub`では一覧に含まれるキーだけを非表示にする', () => {
    const params = { displayMode: 'sub', selected: ['a', 'b'] } as const;

    expect(shouldShowKey({ ...params, key: 'a' })).toBe(false);
    expect(shouldShowKey({ ...params, key: 'c' })).toBe(true);
  });

  test('選択が空の場合、`add`は全て非表示・`sub`は全て表示となる', () => {
    expect(shouldShowKey({ displayMode: 'add', selected: [], key: 'a' })).toBe(false);
    expect(shouldShowKey({ displayMode: 'sub', selected: [], key: 'a' })).toBe(true);
  });
});

describe('shouldShowLabel', () => {
  const label = (elementId: string, text: string) => ({ elementId, text });

  test('要素IDが指定されているラベルを判定する', () => {
    const params = { displayMode: 'add', selected: ['notice'] } as const;

    expect(shouldShowLabel({ ...params, label: label('notice', '') })).toBe(true);
    expect(shouldShowLabel({ ...params, label: label('other', '') })).toBe(false);
  });

  test('要素IDを設定する前に保存された、文言による指定も引き続き参照する', () => {
    const params = { displayMode: 'add', selected: ['基本情報'] } as const;

    expect(shouldShowLabel({ ...params, label: label('notice', '基本情報') })).toBe(true);
    expect(shouldShowLabel({ ...params, label: label('', '基本情報') })).toBe(true);
  });

  test('要素IDも文言も無いラベルは、`add`で非表示・`sub`で表示となる', () => {
    expect(shouldShowLabel({ displayMode: 'add', selected: [''], label: label('', '') })).toBe(
      false
    );
    expect(shouldShowLabel({ displayMode: 'sub', selected: [''], label: label('', '') })).toBe(
      true
    );
  });
});
