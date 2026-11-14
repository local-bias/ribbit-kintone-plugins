import { describe, expect, test } from 'vitest';
import { createTestAsset, createTestCommonConfig } from '@/test/fixtures';
import {
  type AssetRecord,
  applyAssetPatch,
  toAsset,
  toNewAssetRecord,
  toRecordPatch,
  UnmappedFieldError,
} from './asset-mapper';
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

describe('toRecordPatch', () => {
  const common = createTestCommonConfig();

  test('渡した項目だけを、管理アプリの選択肢の値で書く', () => {
    expect(
      toRecordPatch(
        {
          enabled: true,
          scope: 'private',
          order: 300,
          permissions: ['unrestricted', 'put', 'external-listed'],
          externalUrlsText: '# c\nhttps://a.example.com/',
        },
        common
      )
    ).toEqual({
      status: { value: '有効' },
      scope: { value: '自分だけ' },
      order: { value: '300' },
      permissions: { value: ['更新(PUT)', '外部通信(指定先のみ)', '制限なし'] },
      externalUrls: { value: '# c\nhttps://a.example.com/' },
    });
    expect(toRecordPatch({ code: '' }, common)).toEqual({ code: { value: '' } });
  });

  test('AIが書き換えるタイトル・説明・適用画面も書ける', () => {
    expect(
      toRecordPatch({ title: 'T', description: 'D', screens: ['edit', 'index'] }, common)
    ).toEqual({
      title: { value: 'T' },
      description: { value: 'D' },
      screens: { value: [common.screenIndexValue, common.screenEditValue] },
    });
  });

  test('対応付けていないフィールドへは書かずに例外にする', () => {
    expect(() =>
      toRecordPatch({ order: 100 }, createTestCommonConfig({ orderFieldCode: '' }))
    ).toThrow(UnmappedFieldError);
  });

  test('選択肢の値が空の権限は書けない', () => {
    expect(() =>
      toRecordPatch(
        { permissions: ['unrestricted'] },
        createTestCommonConfig({ permissionUnrestrictedValue: '' })
      )
    ).toThrow(UnmappedFieldError);
  });

  test('読み込んだ値をそのまま書き戻すと、同じアセットに戻る', () => {
    const patch = toRecordPatch(
      { scope: 'public', enabled: false, permissions: ['post', 'external-all'] },
      common
    );
    const asset = createTestAsset();
    const record: AssetRecord = {
      ...Object.fromEntries(Object.entries(patch)),
      $id: { value: '1' },
      kind: { value: 'JavaScript' },
    };
    const result = toAsset(record, common);
    expect(result.ok && result.asset).toMatchObject({
      scope: 'public',
      enabled: false,
      permissions: ['post', 'external-all'],
      kind: asset.kind,
    });
  });
});

describe('toNewAssetRecord', () => {
  test('対象・種別・コード・権限・通信先を含む、新しいレコードの値を作る', () => {
    const asset = createTestAsset({
      title: 'コピー',
      kind: 'css',
      scope: 'private',
      enabled: false,
      code: '.a{}',
      order: 900,
      screens: ['index', 'edit'],
      description: 'desc',
      permissions: ['external-listed'],
      externalUrlsText: 'https://fonts.example.com/',
    });
    expect(toNewAssetRecord(asset, createTestCommonConfig())).toEqual({
      title: { value: 'コピー' },
      targetAppId: { value: '42' },
      targetSpaceId: { value: '0' },
      kind: { value: 'CSS' },
      scope: { value: '自分だけ' },
      status: { value: '無効' },
      code: { value: '.a{}' },
      permissions: { value: ['外部通信(指定先のみ)'] },
      order: { value: '900' },
      screens: { value: ['一覧', '編集'] },
      description: { value: 'desc' },
      externalUrls: { value: 'https://fonts.example.com/' },
    });
  });

  test('任意フィールドを対応付けていなければ、その値は書かない', () => {
    const record = toNewAssetRecord(
      createTestAsset(),
      createTestCommonConfig({
        orderFieldCode: '',
        screensFieldCode: '',
        descriptionFieldCode: '',
        externalUrlsFieldCode: '',
      })
    );
    expect(Object.keys(record).sort()).toEqual(
      [
        'code',
        'kind',
        'permissions',
        'scope',
        'status',
        'targetAppId',
        'targetSpaceId',
        'title',
      ].sort()
    );
  });
});

describe('applyAssetPatch', () => {
  test('書き換えた項目を反映し、通信先は解析し直す', () => {
    const asset = createTestAsset({
      permissions: ['external-listed', 'external-all'],
      configurationIssues: ['conflicting-external-permissions'],
    });
    const next = applyAssetPatch(asset, {
      permissions: ['external-listed'],
      externalUrlsText: '# c\nhttps://A.example.com/v1\nhttp://b.example.com\nhttps://*.x.com',
    });
    expect(next).toMatchObject({
      permissions: ['external-listed'],
      configurationIssues: [],
      externalUrls: ['https://a.example.com/v1', 'http://b.example.com/'],
      invalidExternalUrls: [{ line: 4, raw: 'https://*.x.com', reason: 'wildcard' }],
      externalUrlWarnings: [{ line: 3, pattern: 'http://b.example.com/', reason: 'insecure' }],
    });
    expect(asset.permissions).toEqual(['external-listed', 'external-all']);
  });
});

describe('選択肢の値が空の設定', () => {
  test('未入力のレコードを「全員」「有効」「JavaScript」として扱わない', () => {
    const common = createTestCommonConfig({
      kindJsValue: '',
      scopePublicValue: '',
      statusEnabledValue: '',
    });
    const record: AssetRecord = { $id: { value: '1' }, kind: { value: 'CSS' } };
    const result = toAsset(record, common);
    expect(result.ok && result.asset).toMatchObject({
      kind: 'css',
      scope: 'private',
      enabled: false,
    });
    expect(toAsset({ $id: { value: '2' } }, common)).toMatchObject({
      ok: false,
      reason: 'unknown-kind',
    });
  });
});

describe('applyAssetPatch(未定義の項目)', () => {
  test('値が undefined の項目で既存の値を消さない', () => {
    const asset = createTestAsset({ enabled: true });
    expect(applyAssetPatch(asset, { code: 'x', enabled: undefined })).toMatchObject({
      code: 'x',
      enabled: true,
    });
  });
});
