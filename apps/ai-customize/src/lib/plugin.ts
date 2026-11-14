import type {
  AnyPluginConfig,
  PluginCommonConfig,
  PluginConfig,
  ProviderType,
} from '@/schema/plugin-config';

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
  conversationFieldCode: '',
  modelFieldCode: '',

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

  publishAllowedUsers: [],
  publishAllowedGroups: [],
  publishAllowedOrganizations: [],
  chatAllowedUsers: [],
  chatAllowedGroups: [],
  chatAllowedOrganizations: [],
  sendsRecordToAi: false,
  savesConversation: false,

  providerType: 'openai',
  baseUrl: '',
  azureResourceName: '',
  azureDeploymentName: '',
  azureApiVersion: '',
  model: '',
  temperature: null,
  maxOutputTokens: 8000,
  maxToolSteps: 8,
  additionalSystemPrompt: '',
  registeredProxyEndpoint: '',
});

/** プラグインの設定情報のひな形を返却します */
export const createConfig = (): PluginConfig => ({
  version: 1,
  common: createCommonConfig(),
  conditions: [],
});

const PROVIDER_TYPES: readonly ProviderType[] = [
  'openai',
  'anthropic',
  'google',
  'openrouter',
  'azure-openai',
  'custom',
];

const isInteger = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

/**
 * 型だけでは表せない制約(`src/schema/plugin-config.ts`のスキーマと同じ範囲)
 *
 * 操作画面でzodを読み込まない(全ページで読まれるdesktop.jsを小さく保つ)ため、ここで直接確かめる
 */
const CONSTRAINTS: Partial<Record<keyof PluginCommonConfig, (value: unknown) => boolean>> = {
  providerType: (value) => PROVIDER_TYPES.includes(value as ProviderType),
  temperature: (value) => value === null || (typeof value === 'number' && value >= 0 && value <= 2),
  maxOutputTokens: (value) => isInteger(value, 256, 65_536),
  maxToolSteps: (value) => isInteger(value, 1, 20),
};

/** 保存済みの値を、既定値と同じ型として読みます。読めなければ`undefined` */
const readSameType = (candidate: unknown, fallback: unknown): unknown => {
  if (Array.isArray(fallback)) {
    return Array.isArray(candidate)
      ? candidate.filter((item): item is string => typeof item === 'string')
      : undefined;
  }
  if (fallback === null) {
    // `null`を既定値に持つのは、未指定を表す数値の項目(temperature)
    return candidate === null || typeof candidate === 'number' ? candidate : undefined;
  }
  return typeof candidate === typeof fallback ? candidate : undefined;
};

/**
 * 保存済みの共通設定に、後から追加された項目を補完します
 *
 * 設定情報はスキーマ検証を通していないため、値の型も信頼せずに扱います。
 * 型や範囲が合わない値は、項目ごとに既定値に倒します。
 */
const normalizeCommonConfig = (value: unknown): PluginCommonConfig => {
  const saved = (value ?? {}) as Partial<Record<keyof PluginCommonConfig, unknown>>;
  const defaults = createCommonConfig();
  const keys = Object.keys(defaults) as (keyof PluginCommonConfig)[];
  return Object.fromEntries(
    keys.map((key) => {
      const candidate = readSameType(saved[key], defaults[key]);
      const valid =
        candidate !== undefined &&
        (typeof candidate !== 'number' || Number.isFinite(candidate)) &&
        (CONSTRAINTS[key]?.(candidate) ?? true);
      return [key, valid ? candidate : defaults[key]];
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
