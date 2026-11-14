import type { Asset, AssetPatch, AssetPermission, AssetScreen } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import { DEFAULT_ASSET_ORDER, MAX_CODE_BYTES } from './constants';
import { parseExternalPatterns } from './external-target';

/**
 * アセット管理アプリのレコードを`Asset`へ変換します(純粋関数)
 *
 * レコードの値はプラグインの外で自由に編集できるため、全て信頼せずに扱う。
 * 迷ったら安全側(実行しない・privateにする・無効にする・権限を付けない)へ倒す。
 *
 * @see docs/04-asset-app.md 4章
 */

/** REST APIで取得したレコード。フィールドの型は信頼しない */
export type AssetRecord = Record<string, { type?: unknown; value?: unknown } | undefined>;

export type AssetMappingResult =
  | { ok: true; asset: Asset }
  | { ok: false; id: string; reason: AssetMappingError };

export type AssetMappingError = 'missing-id' | 'unknown-kind' | 'code-too-large';

const encoder = new TextEncoder();

const readValue = (record: AssetRecord, code: string): unknown =>
  code === '' ? undefined : record[code]?.value;

const readString = (record: AssetRecord, code: string): string => {
  const value = readValue(record, code);
  return typeof value === 'string' ? value : '';
};

const readStringArray = (record: AssetRecord, code: string): string[] => {
  const value = readValue(record, code);
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
};

/**
 * 所有者(作成者フィールド)のログイン名
 *
 * 変更できない作成者フィールドでなければ空文字にする(privateは誰にも適用されなくなる)。
 * 設定のインポートなどで編集可能なユーザー選択フィールドが対応付けられても、
 * 他人を所有者にしたprivateアセットを作れないようにするため(ADR-19)
 */
const readOwnerCode = (record: AssetRecord, code: string): string => {
  if (record[code]?.type !== 'CREATOR') {
    return '';
  }
  const value = readValue(record, code) as { code?: unknown } | undefined;
  return typeof value?.code === 'string' ? value.code : '';
};

/**
 * レコードの値が選択肢の値と一致するか
 *
 * 設定の選択肢の値が空なら一致させない(未入力のレコードが「全員」「有効」に倒れないように)
 */
const matchesOption = (value: string, option: string): boolean => option !== '' && value === option;

/** 数値フィールドを、先頭0や小数を許さない整数の文字列として読みます。読めなければ`null` */
const readInteger = (record: AssetRecord, code: string): string | null => {
  const value = readString(record, code).trim();
  return /^\d+$/.test(value) ? String(Number(value)) : null;
};

const readOrder = (record: AssetRecord, common: PluginCommonConfig): number => {
  const raw = readString(record, common.orderFieldCode).trim();
  const value = Number(raw);
  return raw !== '' && Number.isFinite(value) ? value : DEFAULT_ASSET_ORDER;
};

/** 「適用画面」の選択肢の値と、画面の対応 */
const screenOptions = (common: PluginCommonConfig): [string, AssetScreen][] => [
  [common.screenIndexValue, 'index'],
  [common.screenDetailValue, 'detail'],
  [common.screenCreateValue, 'create'],
  [common.screenEditValue, 'edit'],
];

/** 「権限」の選択肢の値と、権限の対応 */
const permissionOptions = (common: PluginCommonConfig): [string, AssetPermission][] => [
  [common.permissionPostValue, 'post'],
  [common.permissionPutValue, 'put'],
  [common.permissionDeleteValue, 'delete'],
  [common.permissionExternalListedValue, 'external-listed'],
  [common.permissionExternalAllValue, 'external-all'],
  [common.permissionUnrestrictedValue, 'unrestricted'],
];

const readScreens = (record: AssetRecord, common: PluginCommonConfig): AssetScreen[] => {
  const mapping = screenOptions(common);
  const selected = readStringArray(record, common.screensFieldCode);
  return mapping.filter(([value]) => selected.includes(value)).map(([, screen]) => screen);
};

/**
 * 権限を読みます
 *
 * 未知の値は無視する(権限が増える方向に倒さない)。
 * 「指定先のみ」と「すべて」が両方あるときは、狭いほうの「指定先のみ」として扱う。
 */
const readPermissions = (
  record: AssetRecord,
  common: PluginCommonConfig
): { permissions: AssetPermission[]; conflicting: boolean } => {
  const mapping = permissionOptions(common);
  const selected = readStringArray(record, common.permissionsFieldCode);
  const permissions = mapping
    .filter(([value]) => value !== '' && selected.includes(value))
    .map(([, permission]) => permission);
  const conflicting =
    permissions.includes('external-listed') && permissions.includes('external-all');
  return {
    permissions: conflicting
      ? permissions.filter((permission) => permission !== 'external-all')
      : permissions,
    conflicting,
  };
};

/** レコードを`Asset`へ変換します */
export const toAsset = (record: AssetRecord, common: PluginCommonConfig): AssetMappingResult => {
  const id = readInteger(record, '$id');
  if (id === null) {
    return { ok: false, id: '', reason: 'missing-id' };
  }

  const kindValue = readString(record, common.kindFieldCode);
  const kind = matchesOption(kindValue, common.kindJsValue)
    ? 'js'
    : matchesOption(kindValue, common.kindCssValue)
      ? 'css'
      : null;
  if (kind === null) {
    return { ok: false, id, reason: 'unknown-kind' };
  }

  const code = readString(record, common.codeFieldCode);
  if (encoder.encode(code).length > MAX_CODE_BYTES) {
    return { ok: false, id, reason: 'code-too-large' };
  }

  const { permissions, conflicting } = readPermissions(record, common);
  const externalUrlsText = readString(record, common.externalUrlsFieldCode);
  const external = parseExternalPatterns(externalUrlsText);

  return {
    ok: true,
    asset: {
      id,
      revision: readString(record, '$revision'),
      title: readString(record, common.titleFieldCode),
      // 対象座標が読めないレコードは、どの対象アプリにも一致しない値にする
      targetAppId: readInteger(record, common.targetAppIdFieldCode) ?? '',
      targetSpaceId: readInteger(record, common.targetSpaceIdFieldCode) ?? '',
      kind,
      // 未知のscopeはprivateへ倒す(意図せず全員へ配られるのを防ぐ)
      scope: matchesOption(readString(record, common.scopeFieldCode), common.scopePublicValue)
        ? 'public'
        : 'private',
      // 未知のstatusは無効へ倒す
      enabled: matchesOption(readString(record, common.statusFieldCode), common.statusEnabledValue),
      ownerCode: readOwnerCode(record, common.ownerFieldCode),
      code,
      order: readOrder(record, common),
      screens: readScreens(record, common),
      description: readString(record, common.descriptionFieldCode),
      permissions,
      externalUrls: external.patterns,
      externalUrlsText,
      invalidExternalUrls: external.invalid,
      externalUrlWarnings: external.warnings,
      configurationIssues: conflicting ? ['conflicting-external-permissions'] : [],
    },
  };
};

/**
 * パネルの一覧に出す、作成者名と更新日時を読みます
 *
 * @param updatedTimeFieldCode 更新日時フィールドのコード。無ければ空文字
 */
export const readPanelMeta = (
  record: AssetRecord,
  common: PluginCommonConfig,
  updatedTimeFieldCode: string
): { ownerName: string; updatedAt: string | null } => {
  const owner = readValue(record, common.ownerFieldCode) as { name?: unknown } | undefined;
  const updatedAt = readString(record, updatedTimeFieldCode);
  return {
    ownerName: typeof owner?.name === 'string' ? owner.name : '',
    updatedAt: updatedAt === '' ? null : updatedAt,
  };
};

/** レコードの更新・追加に渡す値 */
export type AssetRecordValues = Record<string, { value: unknown }>;

/** 書き込もうとしたフィールドや選択肢が、プラグイン設定で対応付けられていない */
export class UnmappedFieldError extends Error {
  override name = 'UnmappedFieldError';
}

const requireCode = (code: string, label: string): string => {
  if (code === '') {
    throw new UnmappedFieldError(label);
  }
  return code;
};

const toPermissionValues = (
  permissions: readonly AssetPermission[],
  common: PluginCommonConfig
): string[] =>
  permissionOptions(common)
    .filter(([, permission]) => permissions.includes(permission))
    .map(([value, permission]) => requireCode(value, permission));

const toScreenValues = (screens: readonly AssetScreen[], common: PluginCommonConfig): string[] =>
  screenOptions(common)
    .filter(([, screen]) => screens.includes(screen))
    .map(([value, screen]) => requireCode(value, screen));

/**
 * パネルで書き換えた項目を、レコード更新の値にします(渡した項目だけを書く)
 *
 * 対応付けていないフィールドへは書けない。操作の可否は`asset-access`で先に判定しておく。
 * 「権限」は対応付けた選択肢だけで書き直すため、管理アプリで足された未知の値は消える(権限が増える方向には働かない)
 *
 * @throws {UnmappedFieldError}
 */
export const toRecordPatch = (patch: AssetPatch, common: PluginCommonConfig): AssetRecordValues => {
  const values: AssetRecordValues = {};
  if (patch.enabled !== undefined) {
    values[requireCode(common.statusFieldCode, 'status')] = {
      value: patch.enabled ? common.statusEnabledValue : common.statusDisabledValue,
    };
  }
  if (patch.scope !== undefined) {
    values[requireCode(common.scopeFieldCode, 'scope')] = {
      value: patch.scope === 'public' ? common.scopePublicValue : common.scopePrivateValue,
    };
  }
  if (patch.code !== undefined) {
    values[requireCode(common.codeFieldCode, 'code')] = { value: patch.code };
  }
  if (patch.order !== undefined) {
    values[requireCode(common.orderFieldCode, 'order')] = { value: String(patch.order) };
  }
  if (patch.permissions !== undefined) {
    values[requireCode(common.permissionsFieldCode, 'permissions')] = {
      value: toPermissionValues(patch.permissions, common),
    };
  }
  if (patch.externalUrlsText !== undefined) {
    values[requireCode(common.externalUrlsFieldCode, 'externalUrls')] = {
      value: patch.externalUrlsText,
    };
  }
  if (patch.title !== undefined) {
    values[requireCode(common.titleFieldCode, 'title')] = { value: patch.title };
  }
  if (patch.description !== undefined) {
    values[requireCode(common.descriptionFieldCode, 'description')] = {
      value: patch.description,
    };
  }
  if (patch.screens !== undefined) {
    values[requireCode(common.screensFieldCode, 'screens')] = {
      value: toScreenValues(patch.screens, common),
    };
  }
  return values;
};

/**
 * アセットを複製するときの、新しいレコードの値
 *
 * 所有者は作成者フィールドなので、複製した人になる。影響範囲と状態は呼び出し側で決める(複製は「自分だけ・無効」にする)
 *
 * @throws {UnmappedFieldError}
 */
export const toNewAssetRecord = (
  asset: Pick<
    Asset,
    | 'title'
    | 'targetAppId'
    | 'targetSpaceId'
    | 'kind'
    | 'scope'
    | 'enabled'
    | 'code'
    | 'order'
    | 'screens'
    | 'description'
    | 'permissions'
    | 'externalUrlsText'
  >,
  common: PluginCommonConfig
): AssetRecordValues => {
  const optional: AssetRecordValues = {};
  if (common.orderFieldCode !== '') {
    optional[common.orderFieldCode] = { value: String(asset.order) };
  }
  if (common.screensFieldCode !== '') {
    optional[common.screensFieldCode] = { value: toScreenValues(asset.screens, common) };
  }
  if (common.descriptionFieldCode !== '') {
    optional[common.descriptionFieldCode] = { value: asset.description };
  }
  if (common.externalUrlsFieldCode !== '') {
    optional[common.externalUrlsFieldCode] = { value: asset.externalUrlsText };
  }
  return {
    [requireCode(common.titleFieldCode, 'title')]: { value: asset.title },
    [requireCode(common.targetAppIdFieldCode, 'targetAppId')]: { value: asset.targetAppId },
    [requireCode(common.targetSpaceIdFieldCode, 'targetSpaceId')]: { value: asset.targetSpaceId },
    [requireCode(common.kindFieldCode, 'kind')]: {
      value: asset.kind === 'js' ? common.kindJsValue : common.kindCssValue,
    },
    ...toRecordPatch(
      {
        scope: asset.scope,
        enabled: asset.enabled,
        code: asset.code,
        permissions: asset.permissions,
      },
      common
    ),
    ...optional,
  };
};

/**
 * 書き換えた項目を反映したアセットを返します(保存に成功した後、一覧を取り直すまでの表示に使う)
 *
 * 「通信先」は読み込み時と同じ規則で解析し直す
 */
export const applyAssetPatch = (asset: Asset, patch: AssetPatch): Asset => {
  // `{ code: 'x', enabled: undefined }`のような値で既存の項目を消さない
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as AssetPatch;
  const next: Asset = { ...asset, ...defined };
  if (patch.externalUrlsText !== undefined) {
    const external = parseExternalPatterns(patch.externalUrlsText);
    next.externalUrls = external.patterns;
    next.invalidExternalUrls = external.invalid;
    next.externalUrlWarnings = external.warnings;
  }
  if (patch.permissions !== undefined) {
    const conflicting =
      patch.permissions.includes('external-listed') && patch.permissions.includes('external-all');
    next.configurationIssues = conflicting ? ['conflicting-external-permissions'] : [];
  }
  return next;
};
