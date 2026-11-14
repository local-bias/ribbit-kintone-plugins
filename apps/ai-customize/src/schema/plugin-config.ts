import { z } from 'zod';

/**
 * 🔌 v1: 初版
 *
 * docs/03-plugin-config.md の項目のうち、アセットの実行に必要なもの(管理アプリとフィールドの対応付け、
 * 選択肢の値)だけを持つ。AIプロバイダ・チャット権限などは、該当機能の実装時に同じv1へ追加する
 * (リリース前のため移行処理は不要。`migrateConfig`が欠けた項目を既定値で補完する)。
 */
const PluginCommonConfigV1Schema = z.object({
  /** アセット管理アプリのID */
  assetAppId: z.string(),
  /** アセット管理アプリのゲストスペースID。通常スペースは空文字 */
  assetAppSpaceId: z.string(),

  // フィールドの対応付け
  titleFieldCode: z.string(),
  targetAppIdFieldCode: z.string(),
  targetSpaceIdFieldCode: z.string(),
  kindFieldCode: z.string(),
  codeFieldCode: z.string(),
  scopeFieldCode: z.string(),
  statusFieldCode: z.string(),
  ownerFieldCode: z.string(),
  permissionsFieldCode: z.string(),
  /** 任意。未設定なら「外部通信(指定先のみ)」は常に空リストとして扱う */
  externalUrlsFieldCode: z.string(),
  /** 任意。未設定なら`$id`昇順 */
  orderFieldCode: z.string(),
  /** 任意。未設定なら全画面 */
  screensFieldCode: z.string(),
  /** 任意 */
  descriptionFieldCode: z.string(),

  // 選択肢の値
  kindJsValue: z.string(),
  kindCssValue: z.string(),
  scopePrivateValue: z.string(),
  scopePublicValue: z.string(),
  statusEnabledValue: z.string(),
  statusDisabledValue: z.string(),
  screenIndexValue: z.string(),
  screenDetailValue: z.string(),
  screenCreateValue: z.string(),
  screenEditValue: z.string(),
  permissionPostValue: z.string(),
  permissionPutValue: z.string(),
  permissionDeleteValue: z.string(),
  permissionExternalListedValue: z.string(),
  permissionExternalAllValue: z.string(),
  permissionUnrestrictedValue: z.string(),
});

const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: PluginCommonConfigV1Schema,
  /** 本プラグインでは未使用。`@repo/plugin/react`の共通ストアの型を満たすためだけに持つ(ADR-8) */
  conditions: z.array(z.object({ id: z.string() })),
});

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = z.infer<typeof PluginConfigV1Schema>;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;
