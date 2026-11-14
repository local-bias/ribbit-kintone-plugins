import type { AnyPluginConfig, PluginCommonConfig, PluginConfig } from '@/schema/plugin-config';

/** 共通設定の既定値を返します */
export const createCommonConfig = (): PluginCommonConfig => ({
  assetAppId: '',
  assetAppSpaceId: '',

  titleFieldCode: '',
  targetAppIdFieldCode: '',
  targetSpaceIdFieldCode: '',
  kindFieldCode: '',
  codeFieldCode: '',
  scopeFieldCode: '',
  statusFieldCode: '',
  ownerFieldCode: '',
  permissionsFieldCode: '',
  externalUrlsFieldCode: '',
  orderFieldCode: '',
  screensFieldCode: '',
  descriptionFieldCode: '',

  kindJsValue: 'JavaScript',
  kindCssValue: 'CSS',
  scopePrivateValue: '自分だけ',
  scopePublicValue: '全員',
  statusEnabledValue: '有効',
  statusDisabledValue: '無効',
  screenIndexValue: '一覧',
  screenDetailValue: '詳細',
  screenCreateValue: '追加',
  screenEditValue: '編集',
  permissionPostValue: '追加(POST)',
  permissionPutValue: '更新(PUT)',
  permissionDeleteValue: '削除(DELETE)',
  permissionExternalListedValue: '外部通信(指定先のみ)',
  permissionExternalAllValue: '外部通信(すべて)',
  permissionUnrestrictedValue: '制限なし',
});

/** プラグインの設定情報のひな形を返却します */
export const createConfig = (): PluginConfig => ({
  version: 1,
  common: createCommonConfig(),
  conditions: [],
});

/**
 * 保存済みの共通設定に、後から追加された項目を補完します
 *
 * 設定情報はスキーマ検証を通していないため、値の型も信頼せずに扱います。
 * 文字列でない値は既定値に倒します。
 */
const normalizeCommonConfig = (value: unknown): PluginCommonConfig => {
  const saved = (value ?? {}) as Partial<Record<keyof PluginCommonConfig, unknown>>;
  const defaults = createCommonConfig();
  const keys = Object.keys(defaults) as (keyof PluginCommonConfig)[];
  return Object.fromEntries(
    keys.map((key) => {
      const candidate = saved[key];
      return [key, typeof candidate === 'string' ? candidate : defaults[key]];
    })
  ) as PluginCommonConfig;
};

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 *
 * @param anyConfig 保存されている設定情報
 * @returns 最新バージョンの設定情報
 */
export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  // v1しか無いため、全てのバージョンを v1 として補完する。
  // 未知のバージョンは`config.js`と`desktop.js`のバージョンが一致していない場合に来うる。
  // v2を追加したら、ここを`switch (anyConfig.version)`による段階的な変換にする
  return {
    version: 1,
    common: normalizeCommonConfig(anyConfig.common),
    conditions: [],
  };
};

/** 対応付けが必須のフィールド */
const REQUIRED_FIELD_KEYS = [
  'titleFieldCode',
  'targetAppIdFieldCode',
  'targetSpaceIdFieldCode',
  'kindFieldCode',
  'codeFieldCode',
  'scopeFieldCode',
  'statusFieldCode',
  'ownerFieldCode',
  'permissionsFieldCode',
] as const satisfies (keyof PluginCommonConfig)[];

/**
 * 操作画面でプラグインを動かせる最小要件を満たしているか判定します
 *
 * 満たさない場合、操作画面ではアセットを一切適用しません
 */
export const isUsableConfig = (common: PluginCommonConfig): boolean =>
  /^\d+$/.test(common.assetAppId) && REQUIRED_FIELD_KEYS.every((key) => common[key] !== '');

/** 必須フィールドのうち、対応付けられていないもののキー */
export const getMissingRequiredFieldKeys = (
  common: PluginCommonConfig
): (typeof REQUIRED_FIELD_KEYS)[number][] =>
  REQUIRED_FIELD_KEYS.filter((key) => common[key] === '');
