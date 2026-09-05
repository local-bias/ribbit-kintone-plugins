import { describe, expect, test } from 'vitest';
import type { PluginCondition } from '@/schema/plugin-config';
import { getSelectedTabStorageKey, resolveInitialTabIndex } from './selected-tab';

const condition = (id: string, tabName: string) => ({ id, tabName }) as PluginCondition;

const conditions = [condition('a', '基本情報'), condition('b', '見積'), condition('c', '履歴')];

describe('getSelectedTabStorageKey', () => {
  test('アプリごとに異なるキーを返す', () => {
    expect(getSelectedTabStorageKey(1)).not.toBe(getSelectedTabStorageKey(2));
  });
});

describe('resolveInitialTabIndex', () => {
  test('指定が無い場合は先頭のタブを選ぶ', () => {
    expect(resolveInitialTabIndex({ conditions, search: '', storedId: null })).toBe(0);
  });

  test('タブが空の場合も0を返す', () => {
    expect(resolveInitialTabIndex({ conditions: [], search: '?tab=2', storedId: 'a' })).toBe(0);
  });

  test('前回選択していたタブを復元する', () => {
    expect(resolveInitialTabIndex({ conditions, search: '', storedId: 'c' })).toBe(2);
  });

  test('存在しないIDが保存されている場合は先頭のタブを選ぶ', () => {
    expect(resolveInitialTabIndex({ conditions, search: '', storedId: 'unknown' })).toBe(0);
  });

  test('URLのタブ名指定を優先する', () => {
    expect(resolveInitialTabIndex({ conditions, search: '?tab=見積', storedId: 'c' })).toBe(1);
  });

  test('URLでは1始まりの番号も指定できる', () => {
    expect(resolveInitialTabIndex({ conditions, search: '?tab=3', storedId: null })).toBe(2);
  });

  test('タブ名が数字の場合は名前の一致を優先する', () => {
    const numeric = [condition('a', '3'), condition('b', 'B'), condition('c', 'C')];

    expect(resolveInitialTabIndex({ conditions: numeric, search: '?tab=3', storedId: null })).toBe(
      0
    );
  });

  test('範囲外・不正な指定は無視して次の優先順位へ倒す', () => {
    expect(resolveInitialTabIndex({ conditions, search: '?tab=9', storedId: 'b' })).toBe(1);
    expect(resolveInitialTabIndex({ conditions, search: '?tab=abc', storedId: 'b' })).toBe(1);
    expect(resolveInitialTabIndex({ conditions, search: '?tab=0', storedId: null })).toBe(0);
  });

  test('他のクエリパラメータが含まれていても解決できる', () => {
    expect(
      resolveInitialTabIndex({ conditions, search: '?record=10&tab=履歴', storedId: null })
    ).toBe(2);
  });
});
