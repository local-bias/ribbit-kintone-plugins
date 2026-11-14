import { describe, expect, test } from 'vitest';
import type { AssetPermission } from '@/schema/asset';
import {
  externalModeOf,
  narrowGrants,
  widensPermissions,
  withExternalMode,
  withPermission,
} from './asset-grants';

describe('externalModeOf', () => {
  test('付与済みの外部通信を3択で返す', () => {
    expect(externalModeOf([])).toBe('none');
    expect(externalModeOf(['put', 'external-listed'])).toBe('listed');
    expect(externalModeOf(['external-all'])).toBe('all');
  });

  test('両方あるときは狭いほう(指定先のみ)', () => {
    expect(externalModeOf(['external-all', 'external-listed'])).toBe('listed');
  });
});

describe('withPermission', () => {
  test('付け外しし、選択肢の順に並べる', () => {
    expect(withPermission(['unrestricted', 'post'], 'put', true)).toEqual([
      'post',
      'put',
      'unrestricted',
    ]);
    expect(withPermission(['post', 'put'], 'post', false)).toEqual(['put']);
  });

  test('元の配列を変えない', () => {
    const permissions = ['post' as const];
    withPermission(permissions, 'put', true);
    expect(permissions).toEqual(['post']);
  });
});

describe('withExternalMode', () => {
  test('外部通信は1つだけ持つ', () => {
    expect(withExternalMode(['post', 'external-listed'], 'all')).toEqual(['post', 'external-all']);
    expect(withExternalMode(['external-all', 'external-listed'], 'none')).toEqual([]);
    expect(withExternalMode([], 'listed')).toEqual(['external-listed']);
  });
});

describe('widensPermissions', () => {
  test('権限を足す変更は、できることが増える', () => {
    expect(widensPermissions([], ['put'])).toBe(true);
    expect(widensPermissions(['put'], ['put', 'unrestricted'])).toBe(true);
  });

  test('外部通信を広げる変更は、できることが増える', () => {
    expect(widensPermissions([], ['external-listed'])).toBe(true);
    expect(widensPermissions(['external-listed'], ['external-all'])).toBe(true);
  });

  test('取り消しと、外部通信を狭める変更は増えない', () => {
    expect(widensPermissions(['put', 'post'], ['post'])).toBe(false);
    expect(widensPermissions(['external-all'], ['external-listed'])).toBe(false);
    expect(widensPermissions(['post'], ['post'])).toBe(false);
  });
});

describe('narrowGrants', () => {
  const grants = (permissions: AssetPermission[], externalUrls: string[] = []) => ({
    permissions,
    externalUrls,
  });

  test('取り消しはすぐ反映し、付与は反映しない', () => {
    expect(narrowGrants(grants(['post', 'put']), grants(['put', 'delete']))).toEqual(
      grants(['put'])
    );
  });

  test('外部通信は狭いほうの範囲にし、指定先どうしなら共通する通信先だけを残す', () => {
    const a = 'https://a.example.com/';
    const b = 'https://b.example.com/';
    expect(
      narrowGrants(grants(['external-listed'], [a]), grants(['external-listed'], [a, b]))
    ).toEqual(grants(['external-listed'], [a]));
    expect(narrowGrants(grants(['external-all']), grants(['external-listed'], [b]))).toEqual(
      grants(['external-listed'], [b])
    );
    expect(narrowGrants(grants(['external-listed'], [a]), grants(['external-all']))).toEqual(
      grants(['external-listed'], [a])
    );
    expect(narrowGrants(grants(['external-listed'], [a]), grants([])).permissions).toEqual([]);
  });

  test('「制限なし」も付与は反映せず、取り消しは反映する', () => {
    expect(narrowGrants(grants([]), grants(['unrestricted'])).permissions).toEqual([]);
    expect(narrowGrants(grants(['unrestricted']), grants([])).permissions).toEqual([]);
  });
});
