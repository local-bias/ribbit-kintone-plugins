import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  type FieldConditionValue,
  LatestPluginConditionSchema,
  type NewElementPolicy,
  type PluginCommonConfig,
  type PluginCondition,
  type PluginConfig,
  type TargetScreen,
} from '@/schema/plugin-config';
import { DEFAULT_TAB_WIDTH, MAX_TAB_WIDTH, MIN_TAB_WIDTH } from './constants';
import { isProd, PLUGIN_ID } from './global';

/**
 * 保存されている値からタブの幅(px)を決定します
 *
 * 設定情報は保存済みのJSONをそのまま復元したもので、値が欠けていたり
 * 想定外の値が入っていたりする可能性があるため、必ずこの関数を通して使用します。
 *
 * @param value 保存されているタブの幅
 * @returns 設定可能な範囲に収めたタブの幅(px)
 */
export const normalizeTabWidth = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_TAB_WIDTH;
  }
  return Math.min(Math.max(Math.round(value), MIN_TAB_WIDTH), MAX_TAB_WIDTH);
};

/**
 * プラグインの設定情報が、最新の設定情報の形式に準拠しているか検証します
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が最新の形式に準拠している場合は`true`、そうでない場合は`false`
 */
export const isPluginConditionMet = (condition: unknown): boolean => {
  return LatestPluginConditionSchema.safeParse(condition).success;
};

/**
 * 操作画面でプラグインを有効にするための最小要件を満たしているか検証します
 *
 * この条件を満たさない場合、設定情報は無効となり、操作画面ではタブとして表示しません
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が利用条件を満たしている場合は`true`、そうでない場合は`false`
 */
export const isUsagePluginConditionMet = (condition: PluginCondition): boolean => {
  return condition.tabName !== '';
};

/** 全ての画面にタブを表示する既定値 */
const ALL_TARGET_SCREENS = ['create', 'edit', 'detail'] as const satisfies TargetScreen[];

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  tabName: '',
  fieldDisplayMode: 'sub',
  fields: [],
  labelDisplayMode: 'sub',
  labels: [],
  groupDisplayMode: 'sub',
  groups: [],
  spaceDisplayMode: 'sub',
  spaceIds: [],
  hrDisplayMode: 'sub',
  hrs: [],
  targetScreens: [...ALL_TARGET_SCREENS],
  displayConditions: [],
  displayConditionLogic: 'and',
  viewerUsers: [],
  viewerGroups: [],
  viewerOrganizations: [],
  statuses: [],
});

/** 新しいレコードの表示条件を生成します */
export const getNewDisplayCondition = (): FieldConditionValue => ({
  fieldCode: '',
  conditionType: 'always',
});

/**
 * フォームへ後から追加された要素の扱いの既定値
 *
 * 既定のタブ設定(`sub`・空配列)は「全て表示」を意味するため、
 * 一括編集の書き出しも既定ではその挙動に揃えます
 */
const DEFAULT_NEW_ELEMENT_POLICY: NewElementPolicy = 'show';

/** 共通設定の既定値を返します */
const createCommonConfig = (): PluginCommonConfig => ({
  tabWidth: DEFAULT_TAB_WIDTH,
  remembersSelectedTab: true,
  notifiesMissingRequiredFields: true,
  newElementPolicy: DEFAULT_NEW_ELEMENT_POLICY,
  collapsesEmptyRows: true,
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 5,
  common: createCommonConfig(),
  conditions: [getNewCondition()],
});

/** UIの都合で挿入されていた空文字を除去します */
const compact = (values: string[] | undefined): string[] =>
  (values ?? []).filter((value) => value !== '');

/** 配列でない値を空配列に倒します */
const toArray = <T>(value: unknown, fallback: T[] = []): T[] =>
  Array.isArray(value) ? (value as T[]) : fallback;

/**
 * 保存済みの共通設定に、後から追加された項目を補完します
 *
 * 設定情報はスキーマ検証を通していないため、値の型も信頼せずに扱います。
 */
const normalizeCommonConfig = (value: unknown): PluginCommonConfig => {
  const common = (value ?? {}) as Partial<Record<keyof PluginCommonConfig, unknown>>;
  const defaults = createCommonConfig();
  return {
    tabWidth: normalizeTabWidth(common.tabWidth),
    remembersSelectedTab:
      typeof common.remembersSelectedTab === 'boolean'
        ? common.remembersSelectedTab
        : defaults.remembersSelectedTab,
    notifiesMissingRequiredFields:
      typeof common.notifiesMissingRequiredFields === 'boolean'
        ? common.notifiesMissingRequiredFields
        : defaults.notifiesMissingRequiredFields,
    newElementPolicy:
      common.newElementPolicy === 'show' || common.newElementPolicy === 'hide'
        ? common.newElementPolicy
        : defaults.newElementPolicy,
    collapsesEmptyRows:
      typeof common.collapsesEmptyRows === 'boolean'
        ? common.collapsesEmptyRows
        : defaults.collapsesEmptyRows,
  };
};

/** 保存済みのタブ設定に、後から追加された項目を補完します */
const normalizeCondition = (value: PluginCondition): PluginCondition => {
  const condition = value as PluginCondition & Partial<Record<keyof PluginCondition, unknown>>;
  return {
    ...condition,
    targetScreens: toArray<TargetScreen>(condition.targetScreens, [...ALL_TARGET_SCREENS]),
    displayConditions: toArray<FieldConditionValue>(condition.displayConditions),
    displayConditionLogic: condition.displayConditionLogic === 'or' ? 'or' : 'and',
    viewerUsers: toArray<string>(condition.viewerUsers),
    viewerGroups: toArray<string>(condition.viewerGroups),
    viewerOrganizations: toArray<string>(condition.viewerOrganizations),
    statuses: toArray<string>(condition.statuses),
    hrDisplayMode: condition.hrDisplayMode === 'add' ? 'add' : 'sub',
    hrs: toArray<string>(condition.hrs),
  };
};

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * 各バージョンは次のバージョンへの変換処理を持ち、再帰的なアクセスによって最新のバージョンに変換されます
 *
 * @param anyConfig 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case undefined:
    case 1: {
      return migrateConfig({
        version: 2,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          id: nanoid(),
        })),
      });
    }
    case 2: {
      return migrateConfig({
        version: 3,
        common: { tabWidth: DEFAULT_TAB_WIDTH },
        conditions: anyConfig.conditions.map((condition) => ({
          id: condition.id,
          tabName: condition.tabName,
          fieldDisplayMode: condition.displayMode ?? 'sub',
          fields: compact(condition.fields),
          labelDisplayMode: condition.labelDisplayMode ?? 'sub',
          labels: compact(condition.labels),
          groupDisplayMode: condition.groupDisplayMode ?? 'sub',
          groups: compact(condition.groups),
          spaceDisplayMode: condition.spaceDisplayMode ?? 'sub',
          spaceIds: compact(condition.spaceIds),
          hidesHR: condition.hidesHR ?? false,
        })),
      });
    }
    case 3: {
      return migrateConfig({
        version: 4,
        common: {
          ...createCommonConfig(),
          tabWidth: normalizeTabWidth(anyConfig.common?.tabWidth),
        },
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          targetScreens: [...ALL_TARGET_SCREENS],
          displayConditions: [],
          displayConditionLogic: 'and',
          viewerUsers: [],
          viewerGroups: [],
          viewerOrganizations: [],
          statuses: [],
        })),
      });
    }
    case 4: {
      return migrateConfig({
        version: 5,
        common: normalizeCommonConfig(anyConfig.common),
        conditions: (anyConfig.conditions ?? []).map((condition) => {
          const { hidesHR, ...rest } = condition;
          return {
            ...rest,
            // 「罫線を全て非表示」は、「指定した罫線だけ表示」+ 対象なしと同じ意味になる
            hrDisplayMode: hidesHR ? ('add' as const) : ('sub' as const),
            hrs: [],
          };
        }),
      });
    }
    case 5:
    default: {
      // `default` -> `config.js`と`desktop.js`のバージョンが一致していない場合に通る可能性があるため必要
      // もし新しいバージョンを追加したらここに追加する
      // return migrateConfig({ version: 6, ...anyConfig });

      // 同じバージョン内で後から追加された項目が欠けている場合があるため補完する
      // (保存済みの設定情報はスキーマ検証を通していないため、値の型も信頼できない)
      return {
        ...anyConfig,
        common: normalizeCommonConfig(anyConfig.common),
        conditions: (anyConfig.conditions ?? []).map(normalizeCondition),
      };
    }
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restore<AnyPluginConfig>(PLUGIN_ID, { debug: !isProd }) ?? createConfig();
  return migrateConfig(config);
};
