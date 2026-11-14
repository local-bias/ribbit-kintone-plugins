import { describe, expect, test } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import { type AssetRecord, toAsset } from './asset-mapper';
import { MAX_CODE_BYTES } from './constants';

const common = createTestCommonConfig();

const createRecord = (overrides: Record<string, unknown> = {}): AssetRecord => {
  const values: Record<string, unknown> = {
    $id: '12',
    $revision: '3',
    title: '保存前チェック',
    targetAppId: '42',
    targetSpaceId: '0',
    kind: 'JavaScript',
    code: 'console.info(1);',
    scope: '全員',
    status: '有効',
    作成者: { code: 'sato', name: '佐藤' },
    permissions: [],
    externalUrls: '',
    order: '200',
    screens: [],
    description: '説明',
    ...overrides,
  };
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key === '作成者' ? { type: 'CREATOR', value } : { value },
    ])
  );
};

const mapOk = (record: AssetRecord) => {
  const result = toAsset(record, common);
  if (!result.ok) {
    throw new Error(`mapping failed: ${result.reason}`);
  }
  return result.asset;
};

describe('toAsset', () => {
  test('基本の変換', () => {
    expect(mapOk(createRecord())).toMatchObject({
      id: '12',
      revision: '3',
      title: '保存前チェック',
      targetAppId: '42',
      targetSpaceId: '0',
      kind: 'js',
      scope: 'public',
      enabled: true,
      ownerCode: 'sato',
      order: 200,
      screens: [],
      permissions: [],
      externalUrls: [],
    });
  });

  test('CSSの種別', () => {
    expect(mapOk(createRecord({ kind: 'CSS' })).kind).toBe('css');
  });

  test('未知の種別は実行対象から外す', () => {
    expect(toAsset(createRecord({ kind: 'Python' }), common)).toEqual({
      ok: false,
      id: '12',
      reason: 'unknown-kind',
    });
  });

  test('$id が無ければ外す', () => {
    expect(toAsset(createRecord({ $id: undefined }), common)).toMatchObject({
      ok: false,
      reason: 'missing-id',
    });
  });

  test('上限を超えるコードは外す', () => {
    expect(toAsset(createRecord({ code: 'a'.repeat(MAX_CODE_BYTES + 1) }), common)).toMatchObject({
      ok: false,
      reason: 'code-too-large',
    });
  });

  test('未知の scope は private へ倒す', () => {
    expect(mapOk(createRecord({ scope: 'みんな' })).scope).toBe('private');
  });

  test('未知の status は無効へ倒す', () => {
    expect(mapOk(createRecord({ status: '有効(仮)' })).enabled).toBe(false);
  });

  test.each([[''], ['abc'], [undefined]])('order %j は既定値 100', (order) => {
    expect(mapOk(createRecord({ order })).order).toBe(100);
  });

  test('所有者フィールドが作成者フィールドでなければ空文字(編集可能なフィールドで所有者を偽れない)', () => {
    const record = createRecord();
    const forged = {
      ...record,
      作成者: { type: 'USER_SELECT', value: { code: 'sato', name: '佐藤' } },
    };
    expect(mapOk(forged).ownerCode).toBe('');
  });

  test('所有者が無ければ空文字', () => {
    expect(mapOk(createRecord({ 作成者: undefined })).ownerCode).toBe('');
  });

  test('対象座標が数値でなければ空文字(どのアプリにも一致しない)', () => {
    const asset = mapOk(createRecord({ targetAppId: '42abc', targetSpaceId: '' }));
    expect(asset.targetAppId).toBe('');
    expect(asset.targetSpaceId).toBe('');
  });

  test('適用画面を選択肢の値から変換する', () => {
    expect(mapOk(createRecord({ screens: ['詳細', '編集', '謎'] })).screens).toEqual([
      'detail',
      'edit',
    ]);
  });

  test('権限を選択肢の値から変換し、未知の値は無視する', () => {
    expect(
      mapOk(createRecord({ permissions: ['更新(PUT)', '管理者', '外部通信(指定先のみ)'] }))
        .permissions
    ).toEqual(['put', 'external-listed']);
  });

  test('指定先のみ と すべて が両方あれば、指定先のみへ倒して不備を記録する', () => {
    const asset = mapOk(
      createRecord({ permissions: ['外部通信(指定先のみ)', '外部通信(すべて)'] })
    );
    expect(asset.permissions).toEqual(['external-listed']);
    expect(asset.configurationIssues).toEqual(['conflicting-external-permissions']);
  });

  test('権限フィールドの値が配列でなければ読み取りのみ', () => {
    expect(mapOk(createRecord({ permissions: '更新(PUT)' })).permissions).toEqual([]);
  });

  test('通信先を解析する', () => {
    const asset = mapOk(
      createRecord({ externalUrls: 'https://api.example.com/v1/\nhttps://*.example.com' })
    );
    expect(asset.externalUrls).toEqual(['https://api.example.com/v1/']);
    expect(asset.invalidExternalUrls).toEqual([
      { line: 2, raw: 'https://*.example.com', reason: 'wildcard' },
    ]);
  });

  test('通信先フィールドを対応付けていなければ空リスト', () => {
    const result = toAsset(
      createRecord({ externalUrls: 'https://api.example.com' }),
      createTestCommonConfig({ externalUrlsFieldCode: '' })
    );
    expect(result.ok && result.asset.externalUrls).toEqual([]);
  });
});
