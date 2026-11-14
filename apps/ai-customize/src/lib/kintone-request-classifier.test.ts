import { describe, expect, test } from 'vitest';
import type { AssetPermission } from '@/schema/asset';
import {
  classifyKintoneRequest,
  hasAnyWritePermission,
  isGranted,
  normalizeKintonePath,
} from './kintone-request-classifier';

const ORIGIN = 'https://example.cybozu.com';

describe('normalizeKintonePath', () => {
  test.each([
    ['/k/v1/record.json', '/k/v1/record'],
    ['/k/v1/record.json?app=1&id=2', '/k/v1/record'],
    [`${ORIGIN}/k/v1/records.json`, '/k/v1/records'],
    ['/k/guest/12/v1/record.json', '/k/v1/record'],
    [`${ORIGIN}/k/guest/3/v1/bulkRequest.json`, '/k/v1/bulkRequest'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeKintonePath(input, ORIGIN)).toBe(expected);
  });

  test('別オリジンは null', () => {
    expect(normalizeKintonePath('https://evil.example/k/v1/record.json', ORIGIN)).toBeNull();
  });
});

describe('classifyKintoneRequest', () => {
  test.each([
    // 読み取り
    ['/k/v1/record.json', 'GET', {}, ['read']],
    ['/k/v1/records.json', 'get', {}, ['read']],
    ['/k/v1/app/form/fields.json', 'GET', {}, ['read']],
    ['/k/v1/records/cursor.json', 'POST', {}, ['read']],
    ['/k/v1/records/cursor.json', 'DELETE', {}, ['read']],
    // レコード
    ['/k/v1/record.json', 'POST', {}, ['post']],
    ['/k/v1/records.json', 'POST', {}, ['post']],
    ['/k/v1/record.json', 'PUT', {}, ['put']],
    ['/k/v1/records.json', 'PUT', {}, ['put']],
    ['/k/v1/records.json', 'DELETE', {}, ['delete']],
    ['/k/guest/5/v1/record.json', 'PUT', {}, ['put']],
    // コメント
    ['/k/v1/record/comment.json', 'POST', {}, ['post']],
    ['/k/v1/record/comment.json', 'DELETE', {}, ['delete']],
    // プロセス管理
    ['/k/v1/record/status.json', 'PUT', {}, ['put']],
    ['/k/v1/records/status.json', 'PUT', {}, ['put']],
    ['/k/v1/record/assignees.json', 'PUT', {}, ['put']],
    // ファイル
    ['/k/v1/file.json', 'POST', {}, ['post-or-put']],
    // アプリ・スペース設定、未知の操作
    ['/k/v1/preview/app/form/fields.json', 'POST', {}, ['unrestricted']],
    ['/k/v1/preview/app/deploy.json', 'POST', {}, ['unrestricted']],
    ['/k/v1/app.json', 'POST', {}, ['unrestricted']],
    ['/k/v1/space/thread.json', 'PUT', {}, ['unrestricted']],
    ['/k/api/internal/something.json', 'POST', {}, ['unrestricted']],
    ['/k/v1/record.json', 'PATCH', {}, ['unrestricted']],
    ['https://evil.example/k/v1/record.json', 'GET', {}, ['unrestricted']],
  ])('%s %s -> %j', (path, method, params, expected) => {
    expect(classifyKintoneRequest(path, method, params, ORIGIN)).toEqual(expected);
  });

  test('bulkRequest は中の各リクエストの和集合', () => {
    const params = {
      requests: [
        { method: 'PUT', api: '/k/v1/record.json', payload: {} },
        { method: 'DELETE', api: '/k/v1/records.json', payload: {} },
        { method: 'GET', api: '/k/v1/record.json', payload: {} },
      ],
    };
    expect(
      classifyKintoneRequest('/k/v1/bulkRequest.json', 'POST', params, ORIGIN).toSorted()
    ).toEqual(['delete', 'put', 'read']);
  });

  test('bulkRequest の中にアプリ設定の変更があれば制限なし', () => {
    const params = {
      requests: [{ method: 'PUT', api: '/k/v1/preview/app/settings.json', payload: {} }],
    };
    expect(classifyKintoneRequest('/k/v1/bulkRequest.json', 'POST', params, ORIGIN)).toContain(
      'unrestricted'
    );
  });

  test.each([
    [{}],
    [{ requests: [] }],
    [{ requests: 'x' }],
    [{ requests: [{ method: 'PUT' }] }],
    [
      {
        requests: [{ method: 'POST', api: '/k/v1/bulkRequest.json', payload: { requests: [] } }],
      },
    ],
  ])('不正な bulkRequest %j は制限なし', (params) => {
    expect(classifyKintoneRequest('/k/v1/bulkRequest.json', 'POST', params, ORIGIN)).toEqual([
      'unrestricted',
    ]);
  });

  test('パスやメソッドが文字列でなければ制限なし', () => {
    expect(classifyKintoneRequest(undefined, 'GET', {}, ORIGIN)).toEqual(['unrestricted']);
    expect(classifyKintoneRequest('/k/v1/record.json', 1, {}, ORIGIN)).toEqual(['unrestricted']);
  });
});

describe('isGranted', () => {
  const cases: [string[], AssetPermission[], boolean][] = [
    [['read'], [], true],
    [['post'], [], false],
    [['post'], ['post'], true],
    [['put', 'delete'], ['put'], false],
    [['put', 'delete'], ['put', 'delete'], true],
    [['post-or-put'], ['put'], true],
    [['post-or-put'], ['post'], true],
    [['post-or-put'], ['delete'], false],
    [['unrestricted'], ['post', 'put', 'delete', 'external-all'], false],
    [['unrestricted'], ['unrestricted'], true],
    [['delete'], ['unrestricted'], true],
    [['post'], ['external-all'], false],
  ];
  test.each(cases)('%j に %j -> %s', (required, permissions, expected) => {
    expect(isGranted(required as never, permissions)).toBe(expected);
  });
});

describe('hasAnyWritePermission', () => {
  test.each([
    [[], false],
    [['external-all'], false],
    [['external-listed'], false],
    [['put'], true],
    [['unrestricted'], true],
  ] as [AssetPermission[], boolean][])('%j -> %s', (permissions, expected) => {
    expect(hasAnyWritePermission(permissions)).toBe(expected);
  });
});
