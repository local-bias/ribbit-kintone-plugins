import { describe, expect, test, vi } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import {
  type AdminProbe,
  canPublish,
  getChatAllowList,
  getPublishAllowList,
  isAllowListEmpty,
  resolveAllowListPermission,
  toAdminProbe,
  type Viewer,
} from './permission';

const viewer = (overrides: Partial<Viewer> = {}): Viewer => ({
  code: 'sato',
  groups: [],
  organizations: [],
  isAppAdmin: false,
  ...overrides,
});

describe('canPublish', () => {
  test('許可リストが全て空なら、アプリ管理者だけが公開できる(空 = 全員可にしない)', () => {
    const common = createTestCommonConfig();
    expect(canPublish(viewer(), common)).toBe(false);
    expect(canPublish(viewer({ isAppAdmin: true }), common)).toBe(true);
  });

  test('ユーザー・グループ・組織のいずれかに一致すれば公開できる', () => {
    const common = createTestCommonConfig({
      publishAllowedUsers: ['tanaka'],
      publishAllowedGroups: ['customizers'],
      publishAllowedOrganizations: ['dx'],
    });
    expect(canPublish(viewer({ code: 'tanaka' }), common)).toBe(true);
    expect(canPublish(viewer({ groups: ['everyone', 'customizers'] }), common)).toBe(true);
    expect(canPublish(viewer({ organizations: ['dx'] }), common)).toBe(true);
    expect(canPublish(viewer({ groups: ['everyone'], organizations: ['sales'] }), common)).toBe(
      false
    );
  });

  test('許可リストがあってもアプリ管理者は公開できる', () => {
    const common = createTestCommonConfig({ publishAllowedUsers: ['tanaka'] });
    expect(canPublish(viewer({ isAppAdmin: true }), common)).toBe(true);
  });

  test('所属を取得できなかった(空配列)ときは、グループ・組織では許可しない', () => {
    const common = createTestCommonConfig({ publishAllowedGroups: ['customizers'] });
    expect(canPublish(viewer({ groups: [] }), common)).toBe(false);
  });
});

describe('isAllowListEmpty', () => {
  test('3つとも空のときだけ空とみなす', () => {
    expect(isAllowListEmpty({ users: [], groups: [], organizations: [] })).toBe(true);
    expect(isAllowListEmpty({ users: [], groups: ['a'], organizations: [] })).toBe(false);
  });
});

describe('toAdminProbe', () => {
  test('成功なら管理者、権限不足なら管理者ではない、それ以外は判定できない', () => {
    expect(toAdminProbe({ ok: true })).toBe('admin');
    expect(toAdminProbe({ ok: false, error: { code: 'CB_NO02' } })).toBe('not-admin');
    expect(toAdminProbe({ ok: false, error: new Error('network') })).toBe('unknown');
  });
});

describe('resolveAllowListPermission', () => {
  const deps = (overrides: Partial<Parameters<typeof resolveAllowListPermission>[0]> = {}) => ({
    list: getPublishAllowList(createTestCommonConfig()),
    loginUserCode: 'sato',
    fetchGroups: vi.fn(async () => ['customizers']),
    fetchOrganizations: vi.fn(async () => ['dx']),
    probeAdmin: vi.fn(async (): Promise<AdminProbe> => 'not-admin'),
    ...overrides,
  });

  test('本人が許可ユーザーなら何も取得しない', async () => {
    const params = deps({
      list: getPublishAllowList(createTestCommonConfig({ publishAllowedUsers: ['sato'] })),
    });
    expect(await resolveAllowListPermission(params)).toEqual({ allowed: true, conclusive: true });
    expect(params.probeAdmin).not.toHaveBeenCalled();
    expect(params.fetchGroups).not.toHaveBeenCalled();
  });

  test('許可リストに無い所属は取得しない', async () => {
    const params = deps();
    expect(await resolveAllowListPermission(params)).toEqual({ allowed: false, conclusive: true });
    expect(params.fetchGroups).not.toHaveBeenCalled();
    expect(params.fetchOrganizations).not.toHaveBeenCalled();
  });

  test('グループで許可される', async () => {
    const params = deps({
      list: getPublishAllowList(createTestCommonConfig({ publishAllowedGroups: ['customizers'] })),
    });
    expect(await resolveAllowListPermission(params)).toEqual({ allowed: true, conclusive: true });
  });

  test('一時的な失敗は権限なしとし、覚えずに再試行できるようにする', async () => {
    expect(
      await resolveAllowListPermission(
        deps({ probeAdmin: vi.fn(async (): Promise<AdminProbe> => 'unknown') })
      )
    ).toEqual({ allowed: false, conclusive: false });
    expect(
      await resolveAllowListPermission(
        deps({
          list: getPublishAllowList(
            createTestCommonConfig({ publishAllowedGroups: ['customizers'] })
          ),
          fetchGroups: vi.fn(async () => {
            throw new Error('network');
          }),
        })
      )
    ).toEqual({ allowed: false, conclusive: false });
  });
});

describe('getChatAllowList', () => {
  test('チャットの許可リストも、全て空ならアプリ管理者のみ', async () => {
    const list = getChatAllowList(createTestCommonConfig());
    const probe = (admin: AdminProbe) =>
      resolveAllowListPermission({
        list,
        loginUserCode: 'sato',
        fetchGroups: async () => [],
        fetchOrganizations: async () => [],
        probeAdmin: async () => admin,
      });
    expect((await probe('not-admin')).allowed).toBe(false);
    expect((await probe('admin')).allowed).toBe(true);
  });
});
