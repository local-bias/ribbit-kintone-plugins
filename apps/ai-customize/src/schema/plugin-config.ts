import { z } from 'zod';

/** AIプロバイダの種類(docs/07b-ai-providers.md 2章) */
export const ProviderTypeSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'openrouter',
  'azure-openai',
  'custom',
]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

/**
 * 🔌 v1: 初版
 *
 * リリース前のため、項目は同じv1へ追加している(移行処理は不要。`migrateConfig`が欠けた項目を既定値で補完する)。
 */
export const PluginCommonConfigSchema = z.object({
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
  /** 任意。未設定なら対話ログを保存しない */
  conversationFieldCode: z.string(),
  /** 任意。生成したモデルを監査用に残す */
  modelFieldCode: z.string(),

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

  // 権限
  /**
   * 「全員」に公開できるユーザーのログイン名。グループ・組織と合わせて全て空なら、アプリ管理者のみ
   *
   * UI上の抑止であり、セキュリティ境界ではない(本体は管理アプリの`scope`のフィールドアクセス権。docs/08-security.md 2-1)
   */
  publishAllowedUsers: z.array(z.string()),
  /** 「全員」に公開できるグループのコード */
  publishAllowedGroups: z.array(z.string()),
  /** 「全員」に公開できる組織のコード */
  publishAllowedOrganizations: z.array(z.string()),
  /** チャットを使えるユーザー。グループ・組織と合わせて全て空なら、アプリ管理者のみ(docs/08-security.md 2-3) */
  chatAllowedUsers: z.array(z.string()),
  chatAllowedGroups: z.array(z.string()),
  chatAllowedOrganizations: z.array(z.string()),
  /** レコード値をAIへ送るツール(`get_record_sample`)を使えるようにする。有効でも呼び出しごとに承認する */
  sendsRecordToAi: z.boolean(),
  /** 対話ログをアセットのレコードへ保存する(`conversationFieldCode`も要る) */
  savesConversation: z.boolean(),

  // AI(BYOK。APIキーはプラグインのproxy設定に保存し、ここには持たない)
  providerType: ProviderTypeSchema,
  /** OpenAI互換API(`custom`)のベースURL。`https:`のみ */
  baseUrl: z.string(),
  azureResourceName: z.string(),
  azureDeploymentName: z.string(),
  azureApiVersion: z.string(),
  model: z.string(),
  /** 未指定(`null`)なら送らない。モデルによって未対応・推奨値が異なるため */
  temperature: z.number().min(0).max(2).nullable(),
  maxOutputTokens: z.number().int().min(256).max(65_536),
  /** ユーザーの発言1件に対する、ツール往復の上限(承認をまたいで累積) */
  maxToolSteps: z.number().int().min(1).max(20),
  additionalSystemPrompt: z.string(),
  /** 最後にAPIキーを登録したproxyのURL。秘密値ではない(docs/07b 5章) */
  registeredProxyEndpoint: z.string(),
});

const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: PluginCommonConfigSchema,
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
