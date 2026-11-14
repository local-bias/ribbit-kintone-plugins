import { describe, expect, test } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import {
  type AssetUsage,
  findUnregisteredTargets,
  listAssetUsage,
  summarizePermissionUsage,
} from './asset-usage';

const ORIGIN = 'https://example.cybozu.com';

describe('listAssetUsage', () => {
  test('JS: kintone.api・外部通信・外部読み込み・迂回できる書き方を行番号順に返す', () => {
    const code = [
      "kintone.api('/k/v1/record.json', 'PUT', {});",
      "kintone.api('/k/v1/records.json', method, {});",
      "kintone.proxy('https://api.example.com/v1', 'GET', {}, {});",
      "img.src = 'https://img.example.com/a.png';",
      "img.src = 'https://img.example.com/?d=' + data;",
      'fetch(url);',
      "kintone.api('/k/v1/record.json', 'GET', {});",
    ].join('\n');
    expect(listAssetUsage(createTestAsset({ kind: 'js', code }), ORIGIN)).toEqual([
      { type: 'api', method: 'PUT', requirements: ['put'], line: 1 },
      { type: 'api', method: 'unknown', requirements: null, line: 2 },
      { type: 'proxy', target: 'https://api.example.com/v1', line: 3 },
      { type: 'resource', target: 'https://img.example.com/a.png', line: 4 },
      { type: 'resource', target: null, line: 5 },
      { type: 'bypass', pattern: 'fetch', line: 6 },
    ]);
  });

  test('JS: 必要な権限は実行時のファサードと同じ表で決める', () => {
    const code = [
      "kintone.api('/k/v1/records/cursor.json', 'POST', {});",
      "kintone.api('/k/v1/bulkRequest.json', 'POST', { requests });",
      "kintone.api('/k/v1/preview/app/form/fields.json', 'PUT', {});",
      "kintone.api('/k/v1/file.json', 'POST', {});",
      "kintone.api(path, 'DELETE', {});",
    ].join('\n');
    const usage = listAssetUsage(createTestAsset({ kind: 'js', code }), ORIGIN);
    expect(usage).toEqual([
      { type: 'api', method: 'POST', requirements: null, line: 2 },
      { type: 'api', method: 'PUT', requirements: ['unrestricted'], line: 3 },
      { type: 'api', method: 'POST', requirements: ['post-or-put'], line: 4 },
      { type: 'api', method: 'DELETE', requirements: null, line: 5 },
    ]);
    expect(summarizePermissionUsage(usage)).toEqual({
      post: { lines: [4], dynamicLines: [2, 5] },
      put: { lines: [4], dynamicLines: [2, 5] },
      delete: { lines: [], dynamicLines: [2, 5] },
      external: { lines: [], dynamicLines: [] },
      unrestricted: { lines: [3], dynamicLines: [] },
    });
  });

  test('CSS: 外部参照を返す(同一オリジンは数えない)', () => {
    const code = `.a { background: url(https://img.example.com/a.png) }\n.b { background: url(${ORIGIN}/x.png) }`;
    expect(listAssetUsage(createTestAsset({ kind: 'css', code }), ORIGIN)).toEqual([
      { type: 'resource', target: 'https://img.example.com/a.png', line: 1 },
    ]);
  });
});

describe('summarizePermissionUsage', () => {
  test('権限ごとに使う行をまとめ、メソッドが変数の呼び出しは実行時判定として3つ全てに出す', () => {
    const usage: AssetUsage[] = [
      { type: 'api', method: 'PUT', requirements: ['put'], line: 1 },
      { type: 'api', method: 'unknown', requirements: null, line: 2 },
      { type: 'api', method: 'PUT', requirements: ['put'], line: 3 },
      { type: 'proxy', target: 'https://api.example.com/v1', line: 4 },
      { type: 'resource', target: null, line: 5 },
      { type: 'bypass', pattern: 'fetch', line: 6 },
    ];
    expect(summarizePermissionUsage(usage)).toEqual({
      post: { lines: [], dynamicLines: [2] },
      put: { lines: [1, 3], dynamicLines: [2] },
      delete: { lines: [], dynamicLines: [2] },
      external: { lines: [4], dynamicLines: [5] },
      unrestricted: { lines: [6], dynamicLines: [] },
    });
  });
});

describe('findUnregisteredTargets', () => {
  test('通信先に一致しない送信先を、クエリを除いた形で行番号とまとめて返す', () => {
    const usage: AssetUsage[] = [
      { type: 'proxy', target: 'https://api.example.com/v1/items?id=1', line: 3 },
      { type: 'proxy', target: 'https://api.example.com/v1/items?id=2', line: 9 },
      { type: 'resource', target: 'https://zip.example.com/api/search', line: 4 },
      { type: 'resource', target: null, line: 5 },
      { type: 'api', method: 'POST', requirements: ['post'], line: 6 },
    ];
    expect(findUnregisteredTargets(usage, ['https://zip.example.com/api'])).toEqual([
      { pattern: 'https://api.example.com/v1/items', lines: [3, 9] },
    ]);
  });
});
