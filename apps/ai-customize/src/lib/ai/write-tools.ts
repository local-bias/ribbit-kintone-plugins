import { tool } from 'ai';
import { z } from 'zod';
import type { AssetAccess } from '@/lib/asset-access';
import type { TargetCoordinate } from '@/lib/asset-query';
import type { AddResult, DeleteResult, UpdateResult } from '@/lib/asset-repository';
import { type CodeValidation, validateAssetCode } from '@/lib/code-validator';
import { DEFAULT_ASSET_ORDER, MAX_ASSETS_PER_APP, MAX_CODE_BYTES } from '@/lib/constants';
import { detectCssExternalReferences } from '@/lib/css-detector';
import type { Asset, AssetPatch, AssetScreen } from '@/schema/asset';
import { canReadAsset } from './tools';
import {
  aiPermissionsOf,
  DeleteAssetInputSchema,
  hasHumanOnlyPermissions,
  resolveEffectiveWrite,
  type SetAssetStateInput,
  SetAssetStateInputSchema,
  toStoredPermissions,
  type WriteAssetInput,
  WriteAssetInputSchema,
  type WriteToolContext,
  WriteToolContextSchema,
} from './write-approval';

/**
 * AIが使う書き込み系ツール(docs/07-ai-tools.md 4章の9〜12)
 *
 * - 書き込みは全て利用者の承認を経る。承認後の実行はAI SDKに任せ、`execute`の中で権限・revision・対象を取り直して再検証する
 * - AIの出力を信用しない。コードは`validateAssetCode`で検証し、拒否した理由をツール結果として返してAIに直させる
 * - 利用者が承認カードで変えた値は`context.approvals`から受け取り、適用した結果をツール結果に載せる
 *   (返さないと、AIは自分の指定が通ったと誤って説明する)
 * - 同じツール呼び出しを2回保存しない。承認後の再開に失敗して再試行すると、SDKは承認済みのツールをもう一度実行するため
 */

/** 新規登録で保存する値(対象座標と所有者はツールの引数にせず、呼び出し側が現在のコンテキストで決める) */
export type NewAssetValues = Pick<
  Asset,
  | 'title'
  | 'kind'
  | 'scope'
  | 'enabled'
  | 'code'
  | 'order'
  | 'screens'
  | 'description'
  | 'permissions'
  | 'externalUrlsText'
>;

export type AssetChange =
  | { type: 'saved'; assetId: string; kind: Asset['kind']; reloadRequired: boolean }
  | { type: 'deleted'; asset: Asset };

export type WriteToolServices = {
  target: TargetCoordinate;
  loginUserCode: string;
  /** kintoneのオリジン */
  origin: string;
  /** 管理アプリで対応付けている任意のフィールド(対応付けていない項目は書かない) */
  mapped: { externalUrls: boolean; description: boolean; screens: boolean; order: boolean };
  checkJsSyntax: (code: string) => string | null;
  /** IDでアセットを取り直す(対象アプリの絞り込みはしない。認可はツールで行う) */
  loadAsset: (id: string) => Promise<Asset | null>;
  /** レコードとフィールドのアクセス権。取得できなければ`null` */
  loadAccess: (id: string) => Promise<AssetAccess | null>;
  canPublish: () => Promise<boolean>;
  /** 対象アプリに登録済みのアセットの件数 */
  countAssets: () => Promise<number>;
  createAsset: (values: NewAssetValues) => Promise<AddResult>;
  updateAsset: (asset: Asset, patch: AssetPatch) => Promise<UpdateResult>;
  deleteAsset: (asset: Asset) => Promise<DeleteResult>;
  /**
   * CSSを保存せずに画面へ一時適用する(前のプレビューは置き換える)
   *
   * @returns 当てたか。チャットを表示していない(解除ボタンが見えない)ときは当てない
   */
  previewCss: (code: string) => boolean;
  /** アセット管理アプリのレコードのURL */
  recordUrl: (id: string) => string;
  /** 保存・削除したことを画面(一覧・CSSの適用)へ伝える */
  onChanged: (change: AssetChange) => void;
};

type Rejection = { status: 'rejected'; reason: string; message: string; [key: string]: unknown };

const MESSAGES = {
  'invalid-code': 'コードに問題があるため保存しませんでした。errors を直して呼び直してください。',
  'not-approved': '利用者の承認が無いため保存しませんでした。',
  'no-publish-permission':
    '利用者に「全員」へ公開する権限が無いため保存しませんでした。scope を private にしてください。',
  'not-found': 'カスタマイズが見つからないか、読む権限がありません。',
  'kind-mismatch': '種別(JS/CSS)は変えられません。新規に登録してください。',
  conflict: '他の人が更新しました。read_asset で読み直してから、もう一度提案してください。',
  'human-only-permissions':
    'このカスタマイズには人が付けた強い権限(制限なし・外部通信すべて)があるため、AIからは変更できません。利用者に詳細画面での変更を案内してください。',
  'no-access': '利用者にこのレコードを変更する権限がありません。',
  'too-many': `カスタマイズが上限(${MAX_ASSETS_PER_APP}件)に達しているため登録できません。`,
  'external-urls-unmapped':
    '管理アプリに「通信先」フィールドが無いため、外部通信を使うカスタマイズは登録できません。',
  'no-changes': '変更する項目がありません。',
  'unused-permission':
    'コードで使っていない権限・送信先は追加できません。必要ならコードを直して write_asset で登録してください。',
  'request-failed': '保存に失敗しました。',
  'too-large': `コードが上限(${MAX_CODE_BYTES / 1024}KiB)を超えています。分割してください。`,
  'external-reference':
    'プレビューでは外部の url() / @import を使えません。外部の参照を除いて呼び直してください。',
  'preview-unavailable':
    '利用者がチャットを閉じているため、プレビューを当てませんでした。必要なら利用者に確認してください。',
} as const;

const reject = (reason: keyof typeof MESSAGES, extra: Record<string, unknown> = {}): Rejection => ({
  status: 'rejected',
  reason,
  message: MESSAGES[reason],
  ...extra,
});

const fromWriteError = (error: { reason: string; message: string }): Rejection =>
  error.reason === 'conflict'
    ? reject('conflict')
    : reject('request-failed', { detail: error.message });

/** `write_asset`の入力だけで分かる検証(承認を求める前と、実行時の両方で使う) */
export const validateWriteAssetInput = (
  input: Pick<WriteAssetInput, 'kind' | 'code' | 'permissions' | 'externalUrls'>,
  services: Pick<WriteToolServices, 'origin' | 'checkJsSyntax'>
): CodeValidation =>
  validateAssetCode({
    kind: input.kind,
    code: input.code,
    permissions: input.permissions,
    externalUrls: input.externalUrls,
    origin: services.origin,
    checkJsSyntax: services.checkJsSyntax,
  });

/** 承認を求めずに拒否するか(直せば通る問題は、利用者に判断させる前にAIへ返す) */
export const isRejectedBeforeApproval = (
  input: WriteAssetInput,
  services: Pick<WriteToolServices, 'origin' | 'checkJsSyntax'>
): boolean => validateWriteAssetInput(input, services).errors.length > 0;

/** 対象アプリのアセットとして取り直し、読めるものだけを返す */
const loadReadable = async (services: WriteToolServices, id: string): Promise<Asset | null> => {
  const asset = await services.loadAsset(id);
  return asset !== null && canReadAsset(asset, services.target, services.loginUserCode)
    ? asset
    : null;
};

const warningTypes = (validation: CodeValidation) =>
  validation.warnings.map((warning) => warning.type);

const createAsset = async (
  services: WriteToolServices,
  input: WriteAssetInput,
  validation: CodeValidation,
  context: { enableAfterSave: boolean; effective: ReturnType<typeof resolveEffectiveWrite> }
) => {
  const { effective } = context;
  if ((await services.countAssets()) >= MAX_ASSETS_PER_APP) return reject('too-many');
  // 新規のJSは必ず無効で保存する(取り消せない評価を、レビュー前に起こさない)
  const enabled = input.kind === 'css' && context.enableAfterSave;
  const screens: AssetScreen[] = services.mapped.screens ? (input.screens ?? []) : [];
  const result = await services.createAsset({
    title: input.title,
    kind: input.kind,
    scope: effective.scope,
    enabled,
    code: input.code,
    order: input.order ?? DEFAULT_ASSET_ORDER,
    screens,
    description: input.description ?? '',
    permissions: toStoredPermissions(effective.permissions, effective.externalUrls),
    externalUrlsText: effective.externalUrls.join('\n'),
  });
  if (result.status === 'error') return reject('request-failed', { detail: result.message });
  services.onChanged({
    type: 'saved',
    assetId: result.id,
    kind: input.kind,
    reloadRequired: false,
  });
  return {
    status: 'saved' as const,
    operation: 'created' as const,
    id: result.id,
    revision: result.revision,
    url: services.recordUrl(result.id),
    enabled,
    appliedScope: effective.scope,
    appliedScreens: screens,
    appliedPermissions: effective.permissions,
    appliedExternalUrls: effective.externalUrls,
    overriddenByUser: effective.overridden,
    warnings: warningTypes(validation),
    note:
      input.kind === 'js'
        ? 'JavaScriptは無効の状態で保存しました。利用者が一覧で有効にし、画面を再読み込みすると動きます。'
        : enabled
          ? 'CSSを保存し、この画面に適用しました。'
          : 'CSSを無効の状態で保存しました。利用者が一覧で有効にすると適用されます。',
  };
};

const updateAsset = async (
  services: WriteToolServices,
  input: WriteAssetInput & { id: string },
  validation: CodeValidation,
  override: WriteToolContext['approvals'][string]
) => {
  const asset = await loadReadable(services, input.id);
  if (asset === null) return reject('not-found');
  if (asset.kind !== input.kind) return reject('kind-mismatch');
  if (input.revision !== asset.revision) return reject('conflict');
  // 人が付けた強い権限を、AIの更新で黙って狭めたり引き継いだりしない
  if (hasHumanOnlyPermissions(asset.permissions)) return reject('human-only-permissions');
  const effective = resolveEffectiveWrite({
    scope: input.scope,
    fallbackScope: asset.scope,
    permissions: input.permissions,
    externalUrls: validation.externalUrls,
    override,
  });
  if (effective.externalUrls.length > 0 && !services.mapped.externalUrls) {
    return reject('external-urls-unmapped');
  }
  if (effective.scope === 'public' && asset.scope !== 'public' && !(await services.canPublish())) {
    return reject('no-publish-permission');
  }
  const access = await services.loadAccess(asset.id);
  const scopeChanged = effective.scope !== asset.scope;
  if (
    access === null ||
    !access.canEditCode ||
    !access.canEditPermissions ||
    (scopeChanged && !access.canChangeScope) ||
    (services.mapped.externalUrls && !access.canEditExternalUrls)
  ) {
    return reject('no-access');
  }
  const patch: AssetPatch = {
    title: input.title,
    code: input.code,
    // 権限は常に明示的に書く(フィールドの初期値や前の値に頼らない)
    permissions: toStoredPermissions(effective.permissions, effective.externalUrls),
    ...(services.mapped.externalUrls
      ? { externalUrlsText: effective.externalUrls.join('\n') }
      : {}),
    ...(input.description !== undefined && services.mapped.description
      ? { description: input.description }
      : {}),
    ...(input.screens !== undefined && services.mapped.screens ? { screens: input.screens } : {}),
    ...(input.order !== undefined && services.mapped.order ? { order: input.order } : {}),
    ...(scopeChanged ? { scope: effective.scope } : {}),
  };
  const result = await services.updateAsset(asset, patch);
  if (result.status === 'error') return fromWriteError(result);
  // 評価済みのJSは取り消せない。有効なJSを直したら、再読み込みで反映される
  const reloadRequired = asset.kind === 'js' && asset.enabled;
  services.onChanged({ type: 'saved', assetId: asset.id, kind: asset.kind, reloadRequired });
  return {
    status: 'saved' as const,
    operation: 'updated' as const,
    id: asset.id,
    revision: result.revision,
    url: services.recordUrl(asset.id),
    // 更新では有効・無効を変えない
    enabled: asset.enabled,
    appliedScope: effective.scope,
    appliedPermissions: effective.permissions,
    appliedExternalUrls: effective.externalUrls,
    overriddenByUser: effective.overridden,
    reloadRequired,
    warnings: warningTypes(validation),
  };
};

/** 増やす権限・送信先を、コードが使っているか(使っていないものを増やさせない) */
const findUnusedAdditions = (
  asset: Asset,
  permissions: SetAssetStateInput['permissions'],
  validation: CodeValidation,
  addedUrls: readonly string[]
): string[] => {
  const unusedPermissions = new Set(
    validation.warnings.flatMap((w) => (w.type === 'unused-permission' ? [w.permission] : []))
  );
  const unusedUrls = new Set(
    validation.warnings.flatMap((w) => (w.type === 'unused-external-url' ? [w.pattern] : []))
  );
  return [
    // CSSは書き込み権限を使わない
    ...(permissions ?? []).filter(
      (permission) =>
        !asset.permissions.includes(permission) &&
        (asset.kind === 'css' || unusedPermissions.has(permission))
    ),
    ...addedUrls.filter((url) => unusedUrls.has(url)),
  ];
};

const setAssetState = async (
  services: WriteToolServices,
  input: SetAssetStateInput,
  override: WriteToolContext['approvals'][string]
) => {
  const { enabled, order, permissions, externalUrls } = input;
  const changesGrants = permissions !== undefined || externalUrls !== undefined;
  if (enabled === undefined && input.scope === undefined && order === undefined && !changesGrants) {
    return reject('no-changes');
  }
  const asset = await loadReadable(services, input.id);
  if (asset === null) return reject('not-found');
  if (input.revision !== asset.revision) return reject('conflict');
  if (changesGrants && hasHumanOnlyPermissions(asset.permissions)) {
    return reject('human-only-permissions');
  }
  const requestedPermissions = permissions ?? aiPermissionsOf(asset.permissions);
  const validation = validateAssetCode({
    kind: asset.kind,
    code: asset.code,
    permissions: requestedPermissions,
    externalUrls: externalUrls ?? asset.externalUrls,
    origin: services.origin,
    checkJsSyntax: () => null,
  });
  const invalidUrls = validation.errors.filter(({ type }) => type === 'invalid-external-url');
  if (invalidUrls.length > 0) return reject('invalid-code', { errors: invalidUrls });
  const addedUrls = validation.externalUrls.filter((url) => !asset.externalUrls.includes(url));
  const unused = findUnusedAdditions(asset, permissions, validation, addedUrls);
  if (unused.length > 0) return reject('unused-permission', { unused });

  const effective = resolveEffectiveWrite({
    scope: input.scope,
    fallbackScope: asset.scope,
    permissions: requestedPermissions,
    externalUrls: validation.externalUrls,
    override,
  });
  if (
    effective.externalUrls.length > 0 &&
    externalUrls !== undefined &&
    !services.mapped.externalUrls
  ) {
    return reject('external-urls-unmapped');
  }
  const scopeChanged = effective.scope !== asset.scope;
  if (effective.scope === 'public' && scopeChanged && !(await services.canPublish())) {
    return reject('no-publish-permission');
  }
  const access = await services.loadAccess(asset.id);
  if (
    access === null ||
    (enabled !== undefined && !access.canToggleStatus) ||
    (scopeChanged && !access.canChangeScope) ||
    (order !== undefined && !access.canReorder) ||
    (changesGrants && !access.canEditPermissions) ||
    (externalUrls !== undefined && !access.canEditExternalUrls)
  ) {
    return reject('no-access');
  }
  const storedPermissions = toStoredPermissions(effective.permissions, effective.externalUrls);
  const patch: AssetPatch = {
    ...(enabled !== undefined ? { enabled } : {}),
    ...(scopeChanged ? { scope: effective.scope } : {}),
    ...(order !== undefined ? { order } : {}),
    ...(changesGrants ? { permissions: storedPermissions } : {}),
    ...(externalUrls !== undefined ? { externalUrlsText: effective.externalUrls.join('\n') } : {}),
  };
  const result = await services.updateAsset(asset, patch);
  if (result.status === 'error') return fromWriteError(result);
  const widened =
    changesGrants &&
    (storedPermissions.some((permission) => !asset.permissions.includes(permission)) ||
      addedUrls.some((url) => effective.externalUrls.includes(url)));
  // JSは、有効化・実行順の変更・権限の付与が再読み込みで反映される(無効化と取り消しはすぐ効く)
  const reloadRequired =
    asset.kind === 'js' && (enabled === true || order !== undefined || widened || scopeChanged);
  services.onChanged({ type: 'saved', assetId: asset.id, kind: asset.kind, reloadRequired });
  return {
    status: 'saved' as const,
    operation: 'state-changed' as const,
    id: asset.id,
    revision: result.revision,
    enabled: enabled ?? asset.enabled,
    appliedScope: effective.scope,
    order: order ?? asset.order,
    appliedPermissions: effective.permissions,
    appliedExternalUrls: effective.externalUrls,
    overriddenByUser: effective.overridden,
    reloadRequired,
  };
};

const deleteAsset = async (services: WriteToolServices, id: string) => {
  const asset = await loadReadable(services, id);
  if (asset === null) return reject('not-found');
  const access = await services.loadAccess(asset.id);
  if (access === null || !access.canDelete) return reject('no-access');
  // 取り直した最新版のrevisionで消す(取り直してから消すまでの間に他の人が更新したら消さない)
  const result = await services.deleteAsset(asset);
  if (result.status === 'error') return fromWriteError(result);
  services.onChanged({ type: 'deleted', asset });
  return { status: 'deleted' as const, id: asset.id, title: asset.title };
};

const encoder = new TextEncoder();

export const createWriteTools = (services: WriteToolServices) => {
  /**
   * 保存できたツール呼び出しの結果(同じ呼び出しを2回保存しない)
   *
   * toolCallIdを使い回すプロバイダーがあっても別の呼び出しを取り違えないよう、ツール名と入力もキーに含める
   */
  const completed = new Map<string, unknown>();
  const once = async <T>(
    key: { toolName: string; toolCallId: string; input: unknown },
    run: () => Promise<T>
  ): Promise<T | unknown> => {
    const id = JSON.stringify([key.toolName, key.toolCallId, key.input]);
    if (completed.has(id)) return completed.get(id);
    const result = await run();
    const status = (result as { status?: unknown }).status;
    if (status === 'saved' || status === 'deleted') completed.set(id, result);
    return result;
  };

  return {
    preview_css: tool({
      description:
        'CSSを保存せずに、いま開いている画面へ一時的に適用します。前のプレビューは置き換わります。利用者はいつでも解除でき、画面を移ると消えます。外部の url() / @import は使えません。',
      inputSchema: z.object({ code: z.string().min(1) }),
      execute: async ({ code }) => {
        if (encoder.encode(code).length > MAX_CODE_BYTES) return reject('too-large');
        // プレビューは権限を持たない。外部の参照があると、許可なく外部へ通信してしまう
        if (detectCssExternalReferences(code, services.origin).length > 0) {
          return reject('external-reference');
        }
        if (!services.previewCss(code)) return reject('preview-unavailable');
        return { status: 'previewing' as const };
      },
    }),
    write_asset: tool({
      description:
        'カスタマイズ(JS/CSS)を新規登録、または更新します。id を省略すると新規登録です。利用者の承認が必要です。結果の applied* が実際に保存された値です(利用者が承認画面で変えることがあります)。',
      inputSchema: WriteAssetInputSchema,
      contextSchema: WriteToolContextSchema,
      execute: (rawInput, { context, toolCallId }) =>
        once({ toolName: 'write_asset', toolCallId, input: rawInput }, async () => {
          // CSSは書き込み権限を使わない。後で人がJSへ書き換えたときに、確認していない権限が残らないよう保存しない
          const input = rawInput.kind === 'css' ? { ...rawInput, permissions: [] } : rawInput;
          const validation = validateWriteAssetInput(input, services);
          if (validation.errors.length > 0) {
            return reject('invalid-code', { errors: validation.errors });
          }
          const override = context.approvals[toolCallId];
          if (override === undefined) return reject('not-approved');
          if (input.id !== undefined) {
            return updateAsset(services, { ...input, id: input.id }, validation, override);
          }
          const effective = resolveEffectiveWrite({
            scope: input.scope,
            fallbackScope: 'private',
            permissions: input.permissions,
            externalUrls: validation.externalUrls,
            override,
          });
          if (effective.externalUrls.length > 0 && !services.mapped.externalUrls) {
            return reject('external-urls-unmapped');
          }
          if (effective.scope === 'public' && !(await services.canPublish())) {
            return reject('no-publish-permission');
          }
          return createAsset(services, input, validation, {
            enableAfterSave: override.enableAfterSave === true,
            effective,
          });
        }),
    }),
    set_asset_state: tool({
      description:
        '登録済みカスタマイズの有効/無効、影響範囲、実行順、権限、送信先を変更します。revision が必要です。利用者の承認が必要です。コードで使っていない権限・送信先は追加できません。',
      inputSchema: SetAssetStateInputSchema,
      contextSchema: WriteToolContextSchema,
      execute: (input, { context, toolCallId }) =>
        once({ toolName: 'set_asset_state', toolCallId, input }, async () => {
          const override = context.approvals[toolCallId];
          if (override === undefined) return reject('not-approved');
          return setAssetState(services, input, override);
        }),
    }),
    delete_asset: tool({
      description:
        '登録済みカスタマイズを削除します。取り消せません。利用者の承認が必要です。止めたいだけなら set_asset_state で無効にしてください。',
      inputSchema: DeleteAssetInputSchema,
      contextSchema: WriteToolContextSchema,
      execute: (input, { context, toolCallId }) =>
        once({ toolName: 'delete_asset', toolCallId, input }, async () => {
          if (context.approvals[toolCallId] === undefined) return reject('not-approved');
          return deleteAsset(services, input.id);
        }),
    }),
  };
};

export type WriteTools = ReturnType<typeof createWriteTools>;
