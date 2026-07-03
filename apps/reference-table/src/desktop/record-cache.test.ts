import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  clearAllCachedRecords,
  clearCachedRecords,
  createRecordCacheKey,
  DEFAULT_RECORD_CACHE_TTL_MS,
  getCachedRecords,
  MAX_RECORD_CACHE_ENTRIES,
  setCachedRecords,
} from './record-cache';
import type { RelatedRecord } from './table';

const record = (id: string): RelatedRecord =>
  ({ $id: { type: '__ID__', value: id } }) as unknown as RelatedRecord;

const makeKey = (suffix: string) =>
  createRecordCacheKey({
    conditionId: `condition-${suffix}`,
    relatedAppId: '10',
    query: `name = "${suffix}" order by $id asc`,
    fields: ['$id', 'name'],
  });

describe('record-cache', () => {
  beforeEach(() => {
    clearAllCachedRecords();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    clearAllCachedRecords();
  });

  test('キーは取得フィールドの順序に依存せず同一になる', () => {
    const keyA = createRecordCacheKey({
      conditionId: 'c1',
      relatedAppId: '10',
      query: 'q',
      fields: ['$id', 'name', 'amount'],
    });
    const keyB = createRecordCacheKey({
      conditionId: 'c1',
      relatedAppId: '10',
      query: 'q',
      fields: ['amount', '$id', 'name'],
    });

    expect(keyA).toBe(keyB);
  });

  test('クエリが異なればキーは異なる', () => {
    const keyA = createRecordCacheKey({
      conditionId: 'c1',
      relatedAppId: '10',
      query: 'name = "a"',
      fields: ['$id'],
    });
    const keyB = createRecordCacheKey({
      conditionId: 'c1',
      relatedAppId: '10',
      query: 'name = "b"',
      fields: ['$id'],
    });

    expect(keyA).not.toBe(keyB);
  });

  test('格納したレコードを取得できる', () => {
    const key = makeKey('a');
    const records = [record('1'), record('2')];

    const entry = setCachedRecords(key, records);

    expect(entry.cachedAt).toBe(Date.now());
    expect(getCachedRecords(key)?.records).toEqual(records);
  });

  test('未登録のキーは null を返す', () => {
    expect(getCachedRecords(makeKey('missing'))).toBeNull();
  });

  test('TTL を過ぎたエントリは破棄され null を返す', () => {
    const key = makeKey('a');
    setCachedRecords(key, [record('1')]);

    vi.advanceTimersByTime(DEFAULT_RECORD_CACHE_TTL_MS + 1);

    expect(getCachedRecords(key)).toBeNull();
    // 破棄済みのため、TTLを延ばしても復活しない
    expect(getCachedRecords(key, { ttl: Number.POSITIVE_INFINITY })).toBeNull();
  });

  test('TTL 内のエントリは保持される', () => {
    const key = makeKey('a');
    setCachedRecords(key, [record('1')]);

    vi.advanceTimersByTime(DEFAULT_RECORD_CACHE_TTL_MS - 1);

    expect(getCachedRecords(key)?.records).toHaveLength(1);
  });

  test('ttl=0 を指定すると期限切れ判定を行わない', () => {
    const key = makeKey('a');
    setCachedRecords(key, [record('1')]);

    vi.advanceTimersByTime(DEFAULT_RECORD_CACHE_TTL_MS * 100);

    expect(getCachedRecords(key, { ttl: 0 })?.records).toHaveLength(1);
  });

  test('clearCachedRecords は指定キーのみ破棄する', () => {
    const keyA = makeKey('a');
    const keyB = makeKey('b');
    setCachedRecords(keyA, [record('1')]);
    setCachedRecords(keyB, [record('2')]);

    clearCachedRecords(keyA);

    expect(getCachedRecords(keyA)).toBeNull();
    expect(getCachedRecords(keyB)?.records).toHaveLength(1);
  });

  test('上限を超えると最も古いエントリから破棄する', () => {
    // 上限ぴったりまで挿入のみ行う（アクセスによる並び替えはしない）
    for (let index = 0; index < MAX_RECORD_CACHE_ENTRIES; index++) {
      setCachedRecords(makeKey(`entry-${index}`), [record(`entry-${index}`)]);
    }

    // 1件追加して上限を超過させると、最初に挿入したエントリが破棄される
    setCachedRecords(makeKey('overflow'), [record('overflow')]);

    expect(getCachedRecords(makeKey('entry-0'))).toBeNull();
    expect(getCachedRecords(makeKey('entry-1'))).not.toBeNull();
    expect(getCachedRecords(makeKey('overflow'))).not.toBeNull();
  });

  test('アクセスしたエントリは新しいものとして扱われ破棄されにくくなる', () => {
    for (let index = 0; index < MAX_RECORD_CACHE_ENTRIES; index++) {
      setCachedRecords(makeKey(`entry-${index}`), [record(`entry-${index}`)]);
    }

    // entry-0 にアクセスして「最近使用」へ移動させる（次に最も古いのは entry-1）
    expect(getCachedRecords(makeKey('entry-0'))).not.toBeNull();

    setCachedRecords(makeKey('overflow'), [record('overflow')]);

    expect(getCachedRecords(makeKey('entry-1'))).toBeNull();
    expect(getCachedRecords(makeKey('entry-0'))).not.toBeNull();
  });

  test('cachedAt は格納時刻を反映する', () => {
    const key = makeKey('a');
    const fixedNow = Date.now();

    const entry = setCachedRecords(key, [record('1')]);

    expect(entry.cachedAt).toBe(fixedNow);
  });

  test('kintoneAPI 型のレコードをそのまま保持する', () => {
    const key = makeKey('typed');
    const typedRecord = {
      $id: { type: '__ID__', value: '99' },
      name: { type: 'SINGLE_LINE_TEXT', value: 'サンプル' },
    } as unknown as kintoneAPI.RecordData as RelatedRecord;

    setCachedRecords(key, [typedRecord]);

    expect(getCachedRecords(key)?.records[0]).toBe(typedRecord);
  });
});
