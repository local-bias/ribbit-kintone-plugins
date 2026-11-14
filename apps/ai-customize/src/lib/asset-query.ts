import type { PluginCommonConfig } from '@/schema/plugin-config';
import { MAX_ASSETS_PER_APP } from './constants';

/**
 * アセット管理アプリへのクエリを組み立てます(純粋関数)
 *
 * @see docs/04-asset-app.md 3章
 */

/** 対象アプリを識別する座標。ゲストスペース間でアプリIDが衝突しうるため、組で扱う(ADR-18) */
export type TargetCoordinate = {
  /** 通常スペースは`'0'` */
  spaceId: string;
  appId: string;
};

/** クエリの文字列値に埋め込むため、`\`と`"`をエスケープします */
export const escapeQueryValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const quote = (value: string): string => `"${escapeQueryValue(value)}"`;

const assertNumeric = (value: string, label: string): void => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a non-negative integer: ${value}`);
  }
};

/**
 * 対象アプリのアセットを取得するクエリを返します
 *
 * `public`と、ログインユーザーが作成した`private`だけを取得する(ADR-5)。
 * 実行上限を超えたことを検出するため、上限+1件を取得する。
 *
 * @param options.enabledOnly 有効なものだけに絞るか(起動時は`true`)
 */
export const buildAssetQuery = (
  common: PluginCommonConfig,
  target: TargetCoordinate,
  options: { enabledOnly: boolean }
): string => {
  assertNumeric(target.spaceId, 'spaceId');
  assertNumeric(target.appId, 'appId');

  const conditions = [
    `${common.targetSpaceIdFieldCode} = ${target.spaceId}`,
    `${common.targetAppIdFieldCode} = ${target.appId}`,
    ...(options.enabledOnly
      ? [`${common.statusFieldCode} in (${quote(common.statusEnabledValue)})`]
      : []),
    `(${common.scopeFieldCode} in (${quote(common.scopePublicValue)}) or (${common.scopeFieldCode} in (${quote(common.scopePrivateValue)}) and ${common.ownerFieldCode} in (LOGINUSER())))`,
  ];
  const order =
    common.orderFieldCode !== ''
      ? `order by ${common.orderFieldCode} asc, $id asc`
      : 'order by $id asc';

  return `${conditions.join(' and ')} ${order} limit ${MAX_ASSETS_PER_APP + 1}`;
};

/**
 * 実行に必要なフィールドコードの一覧を返します
 *
 * 説明など実行に不要な長い値は取得しない(docs/04-asset-app.md 3-3)
 */
export const getRuntimeFieldCodes = (common: PluginCommonConfig): string[] =>
  [
    '$id',
    '$revision',
    common.titleFieldCode,
    common.targetAppIdFieldCode,
    common.targetSpaceIdFieldCode,
    common.kindFieldCode,
    common.codeFieldCode,
    common.scopeFieldCode,
    common.statusFieldCode,
    common.ownerFieldCode,
    common.permissionsFieldCode,
    common.externalUrlsFieldCode,
    common.orderFieldCode,
    common.screensFieldCode,
  ].filter((code) => code !== '');
