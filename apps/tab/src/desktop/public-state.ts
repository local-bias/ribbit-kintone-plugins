import {
  getCybozuUserGroups,
  getCybozuUserOrganizations,
  type kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, appFormLayoutState, atom, currentAppIdAtom } from '@repo/jotai';
import { GUEST_SPACE_ID, isDev, LOGIN_USER } from '@/lib/global';
import {
  filterTargetFields,
  getLayoutGroups,
  getLayoutHrs,
  getLayoutLabels,
  getLayoutSpacers,
} from '@/lib/kintone';
import { isUsagePluginConditionMet, normalizeTabWidth, restorePluginConfig } from '@/lib/plugin';
import { findMissingRequiredFieldCodes } from '@/lib/required-fields';
import { isTabVisible, type TabVisibilityContext } from '@/lib/tab-visibility';
import { shouldShowKey } from '@/lib/visibility';
import type { PluginCondition, TargetScreen } from '@/schema/plugin-config';

export const pluginConfigAtom = atom(restorePluginConfig());

/** 共通設定 */
export const pluginCommonConfigAtom = atom((get) => get(pluginConfigAtom).common);

/**
 * タブの幅(px)
 *
 * 設定画面では範囲外の値も入力できてしまうため、描画時にも必ず正規化して使用します
 */
export const tabWidthAtom = atom((get) => normalizeTabWidth(get(pluginCommonConfigAtom).tabWidth));

/** 現在表示している画面 */
export const currentScreenAtom = atom<TargetScreen>('detail');

/** 現在のレコード。取得できていない場合は`null` */
export const currentRecordAtom = atom<kintoneAPI.RecordData | null>(null);

/** 設定されている全てのタブ */
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);

/** 設定として成立しているタブ */
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);

/** 表示対象となる、このアプリのフィールド一覧 */
export const currentAppFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) =>
  filterTargetFields(
    await get(
      appFormFieldsAtom({ app: get(currentAppIdAtom), guestSpaceId: GUEST_SPACE_ID, debug: isDev })
    )
  )
);

const currentAppFormLayoutAtom = atom(async (get) =>
  get(
    appFormLayoutState({ app: get(currentAppIdAtom), guestSpaceId: GUEST_SPACE_ID, debug: isDev })
  )
);

/** このアプリのグループフィールドのフィールドコード一覧 */
export const currentAppGroupCodesAtom = atom(async (get) =>
  getLayoutGroups(await get(currentAppFormLayoutAtom)).map((group) => group.code)
);

/** このアプリのスペースフィールドの要素ID一覧 */
export const currentAppSpacerElementIdsAtom = atom(async (get) =>
  getLayoutSpacers(await get(currentAppFormLayoutAtom)).map((spacer) => spacer.elementId)
);

/** このアプリのラベルフィールドの一覧(レイアウト順) */
export const currentAppLabelsAtom = atom(async (get) =>
  getLayoutLabels(await get(currentAppFormLayoutAtom))
);

/** このアプリの罫線の一覧(レイアウト順) */
export const currentAppHrsAtom = atom(async (get) =>
  getLayoutHrs(await get(currentAppFormLayoutAtom))
);

/**
 * ログインユーザーの所属情報
 *
 * 閲覧者による表示条件を使用しているタブがある場合のみ取得します。
 * 取得に失敗した場合は`null`となり、閲覧者による絞り込みは行われません。
 */
export const viewerAtom = atom<Promise<TabVisibilityContext['viewer']>>(async (get) => {
  const usesViewerCondition = get(validPluginConditionsAtom).some(
    (condition) =>
      condition.viewerUsers.length > 0 ||
      condition.viewerGroups.length > 0 ||
      condition.viewerOrganizations.length > 0
  );
  const code = LOGIN_USER?.code;
  if (!usesViewerCondition || !code) {
    return null;
  }

  try {
    const [{ groups }, { organizations }] = await Promise.all([
      getCybozuUserGroups(code),
      getCybozuUserOrganizations(code),
    ]);
    return {
      code,
      groups: groups.map((group) => group.code),
      organizations: organizations.map((organization) => organization.code),
    };
  } catch (error) {
    console.warn('[plugin] 閲覧者の所属情報を取得できませんでした', error);
    return null;
  }
});

/** プロセス管理の現在のステータス。プロセス管理が無効な場合は`null` */
export const currentStatusAtom = atom<string | null>((get) => {
  const record = get(currentRecordAtom);
  if (!record) {
    return null;
  }
  const status = Object.values(record).find((field) => field.type === 'STATUS');
  return typeof status?.value === 'string' ? status.value : null;
});

/** 現在の画面状態で実際に表示するタブ */
export const visiblePluginConditionsAtom = atom<Promise<PluginCondition[]>>(async (get) => {
  const context: TabVisibilityContext = {
    screen: get(currentScreenAtom),
    record: get(currentRecordAtom),
    viewer: await get(viewerAtom),
    status: get(currentStatusAtom),
  };
  return get(validPluginConditionsAtom).filter((condition) => isTabVisible(condition, context));
});

/** 現在選択されているタブのインデックス */
export const selectedTabIndexAtom = atom(0);

/** 現在選択されているタブの設定 */
export const selectedConditionAtom = atom<Promise<PluginCondition | null>>(async (get) => {
  const conditions = await get(visiblePluginConditionsAtom);
  return conditions[get(selectedTabIndexAtom)] ?? conditions[0] ?? null;
});

/** 未入力の必須フィールドのフィールドコード */
export const missingRequiredFieldCodesAtom = atom<Promise<string[]>>(async (get) => {
  if (!get(pluginCommonConfigAtom).notifiesMissingRequiredFields) {
    return [];
  }
  return findMissingRequiredFieldCodes({
    fields: await get(currentAppFieldsAtom),
    record: get(currentRecordAtom),
  });
});

/**
 * 未入力の必須フィールドを含むタブのIDの集合
 *
 * タブに印を付けて、保存できない原因が見えるようにするために使用します
 */
export const conditionIdsWithMissingRequiredAtom = atom<Promise<Set<string>>>(async (get) => {
  const missing = await get(missingRequiredFieldCodesAtom);
  if (missing.length === 0) {
    return new Set<string>();
  }
  const conditions = await get(visiblePluginConditionsAtom);
  return new Set(
    conditions
      .filter((condition) =>
        missing.some((code) =>
          shouldShowKey({
            displayMode: condition.fieldDisplayMode,
            selected: condition.fields,
            key: code,
          })
        )
      )
      .map((condition) => condition.id)
  );
});
