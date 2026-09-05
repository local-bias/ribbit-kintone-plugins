import {
  getAppStatus,
  getCybozuGroups,
  getCybozuOrganizations,
  getCybozuUsers,
} from '@konomi-app/kintone-utilities';
import { appFormLayoutState, atom, currentAppIdAtom } from '@repo/jotai';
import { createCurrentAppFieldsAtom } from '@repo/plugin/react';
import { buildBulkEditRows } from '@/lib/bulk-edit';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import {
  filterTargetFields,
  getLayoutGroups,
  getLayoutHrElementIds,
  getLayoutLabelKeys,
  getLayoutSpacers,
} from '@/lib/kintone';

const allCurrentAppFieldsAtom = createCurrentAppFieldsAtom({ guestSpaceId: GUEST_SPACE_ID });

/** 表示・非表示の対象として選択できる、このアプリのフィールド一覧 */
export const currentAppFieldsAtom = atom(async (get) =>
  filterTargetFields(await get(allCurrentAppFieldsAtom))
);

const currentAppFormLayoutAtom = atom(async (get) => {
  const app = get(currentAppIdAtom);
  return await get(appFormLayoutState({ app, guestSpaceId: GUEST_SPACE_ID, preview: true }));
});

/** このアプリのグループフィールドのフィールドコード一覧 */
export const currentAppGroupCodesAtom = atom(async (get) =>
  getLayoutGroups(await get(currentAppFormLayoutAtom)).map((group) => group.code)
);

/** このアプリのスペースフィールドの要素ID一覧 */
export const currentAppSpacerElementIdsAtom = atom(async (get) =>
  getLayoutSpacers(await get(currentAppFormLayoutAtom)).map((spacer) => spacer.elementId)
);

/**
 * このアプリのラベルフィールドの選択肢一覧
 *
 * 要素IDを持つラベルは要素IDを、持たないラベルは文言をキーとして扱います
 */
export const currentAppLabelKeysAtom = atom(async (get) =>
  getLayoutLabelKeys(await get(currentAppFormLayoutAtom))
);

/** このアプリの罫線のうち、要素IDが設定されているものの要素ID一覧 */
export const currentAppHrElementIdsAtom = atom(async (get) =>
  getLayoutHrElementIds(await get(currentAppFormLayoutAtom))
);

/**
 * 一括編集に表示する、レイアウト順の要素一覧
 *
 * グループフィールドの表示名も解決する必要があるため、
 * 絞り込む前のフィールド情報を渡します
 */
export const bulkEditRowsAtom = atom(async (get) =>
  buildBulkEditRows({
    layout: await get(currentAppFormLayoutAtom),
    fieldProperties: await get(allCurrentAppFieldsAtom),
  })
);

/**
 * このアプリのプロセス管理のステータス名一覧
 *
 * プロセス管理が無効な場合は空配列を返します
 */
export const currentAppStatusNamesAtom = atom(async (get) => {
  const app = get(currentAppIdAtom);
  const status = await getAppStatus({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });
  return status.enable ? Object.keys(status.states ?? {}) : [];
});

/**
 * ユーザー・グループ・組織の選択肢
 *
 * `@konomi-app/kintone-utilities`の戻り値はグローバルの`cybozu`名前空間に依存しており、
 * 本プラグインでは型定義を読み込んでいないため、必要なプロパティのみに絞って受け取ります。
 */
export type EntityOption = { code: string; name: string };

const toEntityOption = ({ code, name }: EntityOption): EntityOption => ({ code, name });

/** kintone環境の全ユーザー */
export const cybozuUsersAtom = atom<Promise<EntityOption[]>>(async () => {
  const { users } = await getCybozuUsers();
  return users.map(toEntityOption);
});

/** kintone環境の全グループ */
export const cybozuGroupsAtom = atom<Promise<EntityOption[]>>(async () => {
  const { groups } = await getCybozuGroups();
  return groups.map(toEntityOption);
});

/** kintone環境の全組織 */
export const cybozuOrganizationsAtom = atom<Promise<EntityOption[]>>(async () => {
  const { organizations } = await getCybozuOrganizations();
  return organizations.map(toEntityOption);
});
