import type { Asset, AssetPermission, AssetScreen } from '@/schema/asset';
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

const readScreens = (record: AssetRecord, common: PluginCommonConfig): AssetScreen[] => {
  const mapping: [string, AssetScreen][] = [
    [common.screenIndexValue, 'index'],
    [common.screenDetailValue, 'detail'],
    [common.screenCreateValue, 'create'],
    [common.screenEditValue, 'edit'],
  ];
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
  const mapping: [string, AssetPermission][] = [
    [common.permissionPostValue, 'post'],
    [common.permissionPutValue, 'put'],
    [common.permissionDeleteValue, 'delete'],
    [common.permissionExternalListedValue, 'external-listed'],
    [common.permissionExternalAllValue, 'external-all'],
    [common.permissionUnrestrictedValue, 'unrestricted'],
  ];
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
  const kind =
    kindValue === common.kindJsValue ? 'js' : kindValue === common.kindCssValue ? 'css' : null;
  if (kind === null) {
    return { ok: false, id, reason: 'unknown-kind' };
  }

  const code = readString(record, common.codeFieldCode);
  if (encoder.encode(code).length > MAX_CODE_BYTES) {
    return { ok: false, id, reason: 'code-too-large' };
  }

  const { permissions, conflicting } = readPermissions(record, common);
  const external = parseExternalPatterns(readString(record, common.externalUrlsFieldCode));

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
      scope:
        readString(record, common.scopeFieldCode) === common.scopePublicValue
          ? 'public'
          : 'private',
      // 未知のstatusは無効へ倒す
      enabled: readString(record, common.statusFieldCode) === common.statusEnabledValue,
      ownerCode: readOwnerCode(record, common.ownerFieldCode),
      code,
      order: readOrder(record, common),
      screens: readScreens(record, common),
      description: readString(record, common.descriptionFieldCode),
      permissions,
      externalUrls: external.patterns,
      invalidExternalUrls: external.invalid,
      externalUrlWarnings: external.warnings,
      configurationIssues: conflicting ? ['conflicting-external-permissions'] : [],
    },
  };
};
