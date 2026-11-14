import { describe, expect, test } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import {
  buildAssetQuery,
  buildAssetRecordPath,
  escapeQueryValue,
  getRuntimeFieldCodes,
} from './asset-query';

describe('escapeQueryValue', () => {
  test('\\ と " をエスケープする', () => {
    expect(escapeQueryValue('a"b\\c')).toBe('a\\"b\\\\c');
  });
});

describe('buildAssetQuery', () => {
  const common = createTestCommonConfig();

  test('起動時は有効なものだけを、対象座標・影響範囲・所有者で絞る', () => {
    expect(buildAssetQuery(common, { spaceId: '0', appId: '42' }, { enabledOnly: true })).toBe(
      'targetSpaceId = 0 and targetAppId = 42 and status in ("有効") and ' +
        '(scope in ("全員") or (scope in ("自分だけ") and 作成者 in (LOGINUSER()))) ' +
        'order by order asc, $id asc limit 101'
    );
  });

  test('パネル用は無効なものも含める', () => {
    expect(
      buildAssetQuery(common, { spaceId: '7', appId: '42' }, { enabledOnly: false })
    ).not.toContain('status in');
  });

  test('選択肢の値をエスケープする', () => {
    const query = buildAssetQuery(
      createTestCommonConfig({ scopePublicValue: '全員") or ("' }),
      { spaceId: '0', appId: '1' },
      { enabledOnly: true }
    );
    expect(query).toContain('scope in ("全員\\") or (\\"")');
  });

  test('実行順フィールドが無ければ $id 昇順', () => {
    const query = buildAssetQuery(
      createTestCommonConfig({ orderFieldCode: '' }),
      { spaceId: '0', appId: '1' },
      { enabledOnly: true }
    );
    expect(query).toContain('order by $id asc limit');
  });

  test.each([
    [{ spaceId: '0', appId: '1 or 1=1' }],
    [{ spaceId: '', appId: '1' }],
    [{ spaceId: '-1', appId: '1' }],
  ])('数値でない座標 %j は例外', (target) => {
    expect(() => buildAssetQuery(common, target, { enabledOnly: true })).toThrow();
  });
});

describe('getRuntimeFieldCodes', () => {
  test('説明は取得せず、未設定の任意フィールドを除く', () => {
    const codes = getRuntimeFieldCodes(
      createTestCommonConfig({ externalUrlsFieldCode: '', screensFieldCode: '' })
    );
    expect(codes).toContain('$revision');
    expect(codes).toContain('permissions');
    expect(codes).not.toContain('description');
    expect(codes).not.toContain('');
  });
});

describe('buildAssetRecordPath', () => {
  test('管理アプリのレコード詳細画面のパス。ゲストスペースはguestを付ける', () => {
    expect(buildAssetRecordPath(createTestCommonConfig({ assetAppSpaceId: '' }), '12')).toBe(
      '/k/99/show#record=12'
    );
    expect(buildAssetRecordPath(createTestCommonConfig({ assetAppSpaceId: '7' }), '12')).toBe(
      '/k/guest/7/99/show#record=12'
    );
  });

  test('数値でないIDは組み立てない', () => {
    expect(() => buildAssetRecordPath(createTestCommonConfig(), '1/../x')).toThrow();
  });
});
