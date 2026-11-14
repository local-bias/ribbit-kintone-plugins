import type { PluginCommonConfig } from '@/schema/plugin-config';

/**
 * プラグイン設定の「許可するユーザー・グループ・組織」による判定(純粋関数)
 *
 * 全て空なら「アプリ管理者のみ」。空 = 全員可 にしてはいけない(ADR-7)。
 * UI上の抑止であり、セキュリティ境界ではない(docs/08-security.md 2-1)
 *
 * @see docs/08-security.md 2-2章
 */

/** 判定に使う、閲覧中のユーザーの情報。所属を取得できなければ空配列・`false`(権限なしへ倒す) */
export type Viewer = {
  code: string;
  groups: readonly string[];
  organizations: readonly string[];
  isAppAdmin: boolean;
};

export type AllowList = {
  users: readonly string[];
  groups: readonly string[];
  organizations: readonly string[];
};

export const isAllowListEmpty = (list: AllowList): boolean =>
  list.users.length === 0 && list.groups.length === 0 && list.organizations.length === 0;

export const isAllowedViewer = (list: AllowList, viewer: Viewer): boolean =>
  viewer.isAppAdmin ||
  list.users.includes(viewer.code) ||
  list.groups.some((group) => viewer.groups.includes(group)) ||
  list.organizations.some((organization) => viewer.organizations.includes(organization));

export const getPublishAllowList = (
  common: Pick<
    PluginCommonConfig,
    'publishAllowedUsers' | 'publishAllowedGroups' | 'publishAllowedOrganizations'
  >
): AllowList => ({
  users: common.publishAllowedUsers,
  groups: common.publishAllowedGroups,
  organizations: common.publishAllowedOrganizations,
});

export const getChatAllowList = (
  common: Pick<
    PluginCommonConfig,
    'chatAllowedUsers' | 'chatAllowedGroups' | 'chatAllowedOrganizations'
  >
): AllowList => ({
  users: common.chatAllowedUsers,
  groups: common.chatAllowedGroups,
  organizations: common.chatAllowedOrganizations,
});

/** 「全員」に公開できるか(private → public の変更、publicアセットの作成) */
export const canPublish = (
  viewer: Viewer,
  common: Parameters<typeof getPublishAllowList>[0]
): boolean => isAllowedViewer(getPublishAllowList(common), viewer);

/** アプリ管理者かの判定結果。`unknown`は通信エラーなどで判定できなかった */
export type AdminProbe = 'admin' | 'not-admin' | 'unknown';

/** kintoneが権限不足で返すエラーコード */
const NO_PERMISSION_CODE = 'CB_NO02';

/**
 * アプリ管理権限が必要なAPIの呼び出し結果から、アプリ管理者かを判定します(ADR-43)
 *
 * 権限不足は「管理者ではない」と確定する。それ以外の失敗は判定できなかったとして扱い、呼び出し側で再試行できるようにする
 */
export const toAdminProbe = (result: { ok: true } | { ok: false; error: unknown }): AdminProbe => {
  if (result.ok) return 'admin';
  const code = (result.error as { code?: unknown } | null)?.code;
  return code === NO_PERMISSION_CODE ? 'not-admin' : 'unknown';
};

export type AllowListPermission = {
  allowed: boolean;
  /** 判定材料が揃っていた(一時的な失敗が無かった)。`false`ならページ内で覚えずに再試行する */
  conclusive: boolean;
};

/**
 * 許可リスト(公開・チャット)に当てはまるかを、所属とアプリ管理権限を取得して判定します
 *
 * 取得に失敗したものは権限なしとして扱う(安全側)。本人が許可ユーザーなら何も取得しない。
 * リストが全て空なら、アプリ管理者だけが当てはまる
 */
export const resolveAllowListPermission = async (params: {
  list: AllowList;
  loginUserCode: string;
  fetchGroups: () => Promise<string[]>;
  fetchOrganizations: () => Promise<string[]>;
  probeAdmin: () => Promise<AdminProbe>;
}): Promise<AllowListPermission> => {
  const { list, loginUserCode } = params;
  if (list.users.includes(loginUserCode)) {
    return { allowed: true, conclusive: true };
  }
  let conclusive = true;
  const membership = (needed: boolean, fetch: () => Promise<string[]>) =>
    needed
      ? fetch().catch(() => {
          conclusive = false;
          return [];
        })
      : Promise.resolve([]);
  const [groups, organizations, admin] = await Promise.all([
    membership(list.groups.length > 0, params.fetchGroups),
    membership(list.organizations.length > 0, params.fetchOrganizations),
    params.probeAdmin().catch((): AdminProbe => 'unknown'),
  ]);
  const allowed = isAllowedViewer(list, {
    code: loginUserCode,
    groups,
    organizations,
    isAppAdmin: admin === 'admin',
  });
  return { allowed, conclusive: allowed || (conclusive && admin !== 'unknown') };
};
