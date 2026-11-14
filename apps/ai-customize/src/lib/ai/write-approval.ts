import { z } from 'zod';
import { withExternalMode } from '@/lib/asset-grants';
import { AI_WRITE_PERMISSIONS, type AiWritePermission } from '@/lib/code-validator';
import { MAX_EXTERNAL_PATTERN_BYTES, MAX_EXTERNAL_PATTERNS } from '@/lib/constants';
import { ASSET_SCREENS, type AssetPermission, type AssetScope } from '@/schema/asset';

/**
 * 書き込みツールの入力と、承認カードでの上書き(純粋関数)
 *
 * 承認の応答は承認/却下の二値しか運べないため、利用者が承認カードで決めた値は
 * 再開時の`options` → `prepareCall` → ツールの`toolsContext`で`execute`へ渡す。
 * 上書きできるのは影響範囲・保存後すぐ有効にするか・権限と通信先(減らす方向だけ)に限る。
 * コード本文とIDは上書きさせない(承認画面で見せたものと保存するものを一致させる)
 *
 * @see docs/07-ai-tools.md 5章、docs/07b-ai-providers.md 4-2章
 */

const RecordIdSchema = z.string().regex(/^[1-9]\d{0,18}$/);
const RevisionSchema = z.string().regex(/^\d{1,19}$/);
const ScopeSchema = z.enum(['private', 'public']);
const PermissionsSchema = z.array(z.enum(AI_WRITE_PERMISSIONS)).max(AI_WRITE_PERMISSIONS.length);
const ExternalUrlsSchema = z
  .array(z.string().max(MAX_EXTERNAL_PATTERN_BYTES))
  .max(MAX_EXTERNAL_PATTERNS);

/** タイトルの上限(一覧で読める長さ) */
const MAX_TITLE_LENGTH = 100;
/** 説明の上限 */
const MAX_DESCRIPTION_LENGTH = 2000;
/** 実行順の上限(数値フィールドに収まる範囲) */
const MAX_ORDER = 1_000_000_000;

export const WriteAssetInputSchema = z.object({
  id: RecordIdSchema.optional().describe('更新するカスタマイズのレコードID。省略すると新規登録'),
  revision: RevisionSchema.optional().describe('更新するとき必須。read_asset で取得した revision'),
  kind: z.enum(['js', 'css']),
  title: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TITLE_LENGTH)
    .describe('何をするカスタマイズか一目で分かる名前'),
  code: z.string().min(1),
  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH)
    .optional()
    .describe('目的・仕組み・注意点を2〜3文で'),
  scope: ScopeSchema.optional().describe(
    '新規の既定は private(自分だけ)。public は利用者が求めたときだけ。最終的には利用者が承認画面で決める'
  ),
  screens: z
    .array(z.enum(ASSET_SCREENS))
    .optional()
    .describe('適用する画面。省略または空配列は全画面'),
  order: z.number().int().min(0).max(MAX_ORDER).optional().describe('実行順(昇順)'),
  permissions: PermissionsSchema.describe(
    'このコードが必要とする書き込み権限。読み取り(GET)は常に許可されるので含めない。不要なら空配列'
  ),
  externalUrls: ExternalUrlsSchema.describe(
    '外部通信の送信先(例: https://api.example.com/v1/)。できるだけ狭く書く。不要なら空配列'
  ),
});
export type WriteAssetInput = z.infer<typeof WriteAssetInputSchema>;

export const SetAssetStateInputSchema = z.object({
  id: RecordIdSchema,
  revision: RevisionSchema.describe('list_assets / read_asset で取得した revision'),
  enabled: z.boolean().optional(),
  scope: ScopeSchema.optional(),
  order: z.number().int().min(0).max(MAX_ORDER).optional(),
  permissions: PermissionsSchema.optional().describe(
    '書き込み権限を変えるときだけ指定。指定した配列で置き換える'
  ),
  externalUrls: ExternalUrlsSchema.optional().describe(
    '送信先を変えるときだけ指定。指定した配列で置き換える。空配列で外部通信を禁止'
  ),
});
export type SetAssetStateInput = z.infer<typeof SetAssetStateInputSchema>;

export const DeleteAssetInputSchema = z.object({
  id: RecordIdSchema,
  reason: z.string().trim().min(1).max(500).describe('削除する理由。承認画面に表示されます'),
});
export type DeleteAssetInput = z.infer<typeof DeleteAssetInputSchema>;

/** 承認カードで利用者が決めた値 */
export const ApprovalOverrideSchema = z.object({
  scope: ScopeSchema.optional(),
  /** 新規のCSSを保存後すぐ有効にする(JSは常に無効で保存する) */
  enableAfterSave: z.boolean().optional(),
  /** 残す書き込み権限(要求されたものから減らすだけ) */
  permissions: PermissionsSchema.optional(),
  /** 残す通信先(正規化済み。要求されたものから減らすだけ) */
  externalUrls: ExternalUrlsSchema.optional(),
});
export type ApprovalOverride = z.infer<typeof ApprovalOverrideSchema>;

/**
 * 書き込みツールのcontext
 *
 * `approvals`のキーは承認されたtoolCallId。キーがあることを「利用者が承認した」印にも使う
 * (承認が要らない経路で書き込まないための二重の確認)
 */
export const WriteToolContextSchema = z.object({
  approvals: z.record(z.string(), ApprovalOverrideSchema),
});
export type WriteToolContext = z.infer<typeof WriteToolContextSchema>;

/** 承認が要る書き込みツール */
export const WRITE_TOOL_NAMES = ['write_asset', 'set_asset_state', 'delete_asset'] as const;
export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

export const isWriteToolName = (name: string): name is WriteToolName =>
  (WRITE_TOOL_NAMES as readonly string[]).includes(name);

/** 要求された値を、利用者の上書きで減らします(増やす方向の上書きは無視する) */
const narrow = <T>(requested: readonly T[], kept: readonly T[] | undefined): T[] =>
  kept === undefined ? [...requested] : requested.filter((value) => kept.includes(value));

export type EffectiveWrite = {
  scope: AssetScope;
  permissions: AiWritePermission[];
  externalUrls: string[];
  /** 利用者が承認カードで何か変えたか */
  overridden: boolean;
};

/**
 * 保存する影響範囲・権限・通信先を決めます
 *
 * @param fallbackScope 指定が無いときの影響範囲(新規は`private`、更新は今の値)
 */
export const resolveEffectiveWrite = (params: {
  scope: AssetScope | undefined;
  fallbackScope: AssetScope;
  permissions: readonly AiWritePermission[];
  /** 正規化済みの通信先 */
  externalUrls: readonly string[];
  override: ApprovalOverride | undefined;
}): EffectiveWrite => {
  const { override } = params;
  const requestedScope = params.scope ?? params.fallbackScope;
  const scope = override?.scope ?? requestedScope;
  const permissions = narrow(params.permissions, override?.permissions);
  const externalUrls = narrow(params.externalUrls, override?.externalUrls);
  return {
    scope,
    permissions,
    externalUrls,
    overridden:
      scope !== requestedScope ||
      permissions.length !== params.permissions.length ||
      externalUrls.length !== params.externalUrls.length,
  };
};

/** レコードの「権限」に書く値(通信先があれば「外部通信(指定先のみ)」を付ける) */
export const toStoredPermissions = (
  permissions: readonly AiWritePermission[],
  externalUrls: readonly string[]
): AssetPermission[] => withExternalMode(permissions, externalUrls.length > 0 ? 'listed' : 'none');

/** 付与済みの権限のうち、AIからの変更で黙って狭めたり引き継いだりしてはいけないもの */
export const hasHumanOnlyPermissions = (permissions: readonly AssetPermission[]): boolean =>
  permissions.includes('unrestricted') || permissions.includes('external-all');

/** 付与済みの権限のうち、AIが扱える書き込み権限 */
export const aiPermissionsOf = (permissions: readonly AssetPermission[]): AiWritePermission[] =>
  AI_WRITE_PERMISSIONS.filter((permission) => permissions.includes(permission));
