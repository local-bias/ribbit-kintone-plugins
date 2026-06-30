import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { PluginCondition } from './plugin';
import { cn, getId, getRandomValue } from './utils';

/**
 * `getId` が参照するのは `mode` と `customIDRules` のみのため、
 * テストではその2つに絞った最小限の `PluginCondition` を生成する。
 */
const buildCondition = (mode: string, customIDRules: unknown[] = []): PluginCondition =>
  ({ mode, customIDRules }) as unknown as PluginCondition;

/** テスト用の単一行テキストフィールドを生成するヘルパー。 */
const textField = (value: string): kintoneAPI.Field =>
  ({ type: 'SINGLE_LINE_TEXT', value }) as unknown as kintoneAPI.Field;

/** テスト用のレコードデータを生成するヘルパー。 */
const buildRecord = (fields: Record<string, kintoneAPI.Field>): kintoneAPI.RecordData =>
  fields as unknown as kintoneAPI.RecordData;

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getRandomValue', () => {
  test('base36（数字と英小文字）のみで構成された文字列を返す', () => {
    expect(getRandomValue()).toMatch(/^[0-9a-z]*$/);
  });

  test('Math.random の戻り値に基づいた値を生成する', () => {
    // (0.5).toString(36) === '0.i' なので、slice(2) は 'i' になる
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(getRandomValue()).toBe('i');
  });

  test('呼び出しごとに異なる値を生成する', () => {
    expect(getRandomValue()).not.toBe(getRandomValue());
  });
});

describe('getId - 単純なモード', () => {
  test('nanoid モードでは空でない文字列を返す', () => {
    const id = getId({ condition: buildCondition('nanoid'), record: buildRecord({}) });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('uuid モードでは UUID v4 形式の文字列を返す', () => {
    const id = getId({ condition: buildCondition('uuid'), record: buildRecord({}) });
    expect(id).toMatch(UUID_V4_PATTERN);
  });

  test('random モードでは Math.random に基づいた値を返す', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const id = getId({ condition: buildCondition('random'), record: buildRecord({}) });
    expect(id).toBe('i');
  });

  test('未知のモードの場合は例外を投げる', () => {
    expect(() =>
      getId({ condition: buildCondition('unknown-mode'), record: buildRecord({}) })
    ).toThrow('Unknown mode: unknown-mode');
  });
});

describe('getId - custom モード', () => {
  test('constant ルールは prefix と value を連結する', () => {
    const condition = buildCondition('custom', [
      { id: 'r1', type: 'constant', prefix: 'PRE-', value: 'ABC' },
    ]);
    expect(getId({ condition, record: buildRecord({}) })).toBe('PRE-ABC');
  });

  test('複数のルールを定義順に連結する', () => {
    const condition = buildCondition('custom', [
      { id: 'r1', type: 'constant', prefix: 'A', value: '1' },
      { id: 'r2', type: 'constant', prefix: 'B', value: '2' },
    ]);
    expect(getId({ condition, record: buildRecord({}) })).toBe('A1B2');
  });

  test('field_value ルールは対象フィールドの値を使用する', () => {
    const condition = buildCondition('custom', [
      { id: 'r1', type: 'field_value', prefix: '', fieldCode: 'name', format: '' },
    ]);
    const record = buildRecord({ name: textField('hello') });
    expect(getId({ condition, record })).toBe('hello');
  });

  test('field_value ルールは prefix とフィールド値を連結する', () => {
    const condition = buildCondition('custom', [
      { id: 'r1', type: 'field_value', prefix: 'ID-', fieldCode: 'name', format: '' },
    ]);
    const record = buildRecord({ name: textField('world') });
    expect(getId({ condition, record })).toBe('ID-world');
  });

  test('field_value ルールで対象フィールドが存在しない場合は prefix のみになる', () => {
    const condition = buildCondition('custom', [
      { id: 'r1', type: 'field_value', prefix: 'P-', fieldCode: 'missing', format: '' },
    ]);
    expect(getId({ condition, record: buildRecord({}) })).toBe('P-');
  });

  test('constant と field_value を組み合わせて連結する', () => {
    const condition = buildCondition('custom', [
      { id: 'r1', type: 'constant', prefix: '', value: 'NO_' },
      { id: 'r2', type: 'field_value', prefix: '', fieldCode: 'code', format: '' },
    ]);
    const record = buildRecord({ code: textField('042') });
    expect(getId({ condition, record })).toBe('NO_042');
  });

  test('nanoid ルールは prefix の後ろに空でない値を付与する', () => {
    const condition = buildCondition('custom', [{ id: 'r1', type: 'nanoid', prefix: 'N-' }]);
    const id = getId({ condition, record: buildRecord({}) });
    expect(id.startsWith('N-')).toBe(true);
    expect(id.length).toBeGreaterThan('N-'.length);
  });

  test('ルールが空の場合は空文字列を返す', () => {
    expect(getId({ condition: buildCondition('custom', []), record: buildRecord({}) })).toBe('');
  });
});

describe('cn', () => {
  test('複数のクラス名を半角スペースで連結する', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  test('falsy な値は無視する', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  test('条件付きクラスを評価する', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});
