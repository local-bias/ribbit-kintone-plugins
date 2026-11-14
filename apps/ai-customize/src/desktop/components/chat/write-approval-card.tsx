import { Button, Checkbox, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { loadable } from '@repo/jotai/utils';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { PendingApproval } from '@/lib/ai/chat-session';
import {
  type ApprovalOverride,
  aiPermissionsOf,
  hasHumanOnlyPermissions,
  type WriteAssetInput,
  WriteAssetInputSchema,
} from '@/lib/ai/write-approval';
import { validateWriteAssetInput } from '@/lib/ai/write-tools';
import { listAssetUsage, summarizePermissionUsage } from '@/lib/asset-usage';
import type {
  AiWritePermission,
  CodeValidation,
  ValidationError,
  ValidationWarning,
} from '@/lib/code-validator';
import { t } from '@/lib/i18n';
import { checkJsSyntax } from '@/lib/js-syntax';
import { countChanges, diffLines } from '@/lib/line-diff';
import type { Asset, AssetScope } from '@/schema/asset';
import { cssPreview } from '../../chat/css-preview';
import { decideApprovalAtom } from '../../states/chat';
import { canPublishAtom, panelAssetsAtom } from '../../states/launcher';
import { formatLines } from '../asset-labels';
import { CodeView } from '../code-view';
import { isTrustedEvent } from '../use-edit-action';
import {
  ApprovalActions,
  ApprovalFrame,
  Blockers,
  DiffView,
  scopeLabel,
  Warnings,
} from './approval-parts';

const panelAssetsLoadableAtom = loadable(panelAssetsAtom);
const canPublishLoadableAtom = loadable(canPublishAtom);

const permissionLabel = (permission: AiWritePermission): string =>
  t(`desktop.row.permission.${permission}`);

const SCREEN_KEYS = {
  index: 'desktop.detail.screen.index',
  detail: 'desktop.detail.screen.detail',
  create: 'desktop.detail.screen.create',
  edit: 'desktop.detail.screen.edit',
} as const;

export const describeWarning = (warning: ValidationWarning): string => {
  switch (warning.type) {
    case 'unused-permission':
      return t('desktop.chat.write.warning.unused-permission', permissionLabel(warning.permission));
    case 'unused-external-url':
    case 'insecure-external-url':
      return t(`desktop.chat.write.warning.${warning.type}`, warning.pattern);
    case 'dynamic-api':
    case 'dynamic-external':
    case 'bulk-operation':
    case 'credential':
      return t(`desktop.chat.write.warning.${warning.type}`, formatLines(warning.lines));
  }
};

/** 保存できない理由(AIへはツール結果として構造のまま返る。ここは利用者向けの要約) */
const describeError = (error: ValidationError): string => {
  const detail =
    'line' in error
      ? `${error.type} (${formatLines([error.line])})`
      : 'lines' in error
        ? `${error.type} (${formatLines(error.lines)})`
        : error.type === 'syntax'
          ? error.message
          : error.type;
  return t('desktop.chat.write.blocker.code', detail);
};

const findBlockers = (
  input: WriteAssetInput,
  validation: CodeValidation,
  existing: Asset | null | undefined
): string[] => [
  ...validation.errors.map(describeError),
  ...(input.id === undefined
    ? []
    : existing === null
      ? [t('desktop.chat.write.blocker.notFound')]
      : existing === undefined
        ? []
        : [
            ...(existing.revision === input.revision
              ? []
              : [t('desktop.chat.write.blocker.stale')]),
            ...(hasHumanOnlyPermissions(existing.permissions)
              ? [t('desktop.chat.write.blocker.humanOnly')]
              : []),
          ]),
];

/** 更新で、いまは付与されていない権限・送信先に付ける注記 */
const newGrantNote = <T,>(granted: readonly T[] | null, value: T): string =>
  granted !== null && !granted.includes(value) ? ` (${t('desktop.chat.write.newGrant')})` : '';

/** 書き込み権限の一覧。外したものは実行時に拒否される */
function PermissionChoices(props: {
  requested: readonly AiWritePermission[];
  kept: readonly AiWritePermission[];
  usedLines: Record<AiWritePermission, number[]>;
  /** いま付与済みの権限(更新のとき)。無いものは「新しく付与」と示す */
  granted: readonly AiWritePermission[] | null;
  onChange: (kept: AiWritePermission[]) => void;
}) {
  if (props.requested.length === 0) {
    return <div>{t('desktop.chat.write.noPermissions')}</div>;
  }
  return (
    <fieldset>
      <legend>{t('desktop.chat.write.permissions')}</legend>
      {props.requested.map((permission) => {
        const checked = props.kept.includes(permission);
        const lines = props.usedLines[permission];
        const note =
          lines.length === 0
            ? t('desktop.chat.write.unused')
            : checked
              ? t('desktop.chat.write.usedAt', formatLines(lines))
              : t('desktop.chat.write.willBeDenied');
        return (
          <FormControlLabel
            key={permission}
            control={
              <Checkbox
                size='small'
                checked={checked}
                onChange={(event) =>
                  props.onChange(
                    event.target.checked
                      ? props.requested.filter((p) => p === permission || props.kept.includes(p))
                      : props.kept.filter((p) => p !== permission)
                  )
                }
              />
            }
            label={`${permissionLabel(permission)} — ${note}${newGrantNote(props.granted, permission)}`}
          />
        );
      })}
    </fieldset>
  );
}

function ExternalUrlChoices(props: {
  requested: readonly string[];
  kept: readonly string[];
  unused: ReadonlySet<string>;
  granted: readonly string[] | null;
  onChange: (kept: string[]) => void;
}) {
  if (props.requested.length === 0) return null;
  return (
    <fieldset>
      <legend>{t('desktop.chat.write.externalUrls')}</legend>
      {props.requested.map((url) => {
        const checked = props.kept.includes(url);
        const note = props.unused.has(url)
          ? ` — ${t('desktop.chat.write.unused')}`
          : checked
            ? ''
            : ` — ${t('desktop.chat.write.willBeDenied')}`;
        return (
          <FormControlLabel
            key={url}
            control={
              <Checkbox
                size='small'
                checked={checked}
                onChange={(event) =>
                  props.onChange(
                    event.target.checked
                      ? props.requested.filter((u) => u === url || props.kept.includes(u))
                      : props.kept.filter((u) => u !== url)
                  )
                }
              />
            }
            label={`${url}${note}${newGrantNote(props.granted, url)}`}
          />
        );
      })}
    </fieldset>
  );
}

function ScopeChoice(props: {
  value: AssetScope;
  requested: AssetScope | undefined;
  /** 「全員」を選べるか(公開権限があるか、すでに「全員」) */
  canPublish: boolean;
  onChange: (scope: AssetScope) => void;
}) {
  return (
    <fieldset>
      <legend>{t('desktop.chat.write.scope')}</legend>
      <RadioGroup
        row
        value={props.value}
        onChange={(event) => props.onChange(event.target.value as AssetScope)}
      >
        <FormControlLabel
          value='private'
          control={<Radio size='small' />}
          label={scopeLabel('private')}
        />
        <FormControlLabel
          value='public'
          control={<Radio size='small' />}
          label={scopeLabel('public')}
          disabled={!props.canPublish}
        />
      </RadioGroup>
      {!props.canPublish && <small>{t('desktop.chat.write.noPublish')}</small>}
      {props.requested === 'public' && props.value !== 'public' && (
        <small>{t('desktop.chat.write.requestedPublic')}</small>
      )}
    </fieldset>
  );
}

/** 新規なら全文、更新なら既存のコードとの差分 */
function CodeSection(props: { input: WriteAssetInput; existing: Asset | null | undefined }) {
  const { input, existing } = props;
  const diff = useMemo(
    () => (existing ? diffLines(existing.code, input.code) : null),
    [existing, input.code]
  );
  if (diff === null) {
    return (
      <div>
        <strong>{t('desktop.chat.write.code')}</strong>
        <CodeView code={input.code} label={t('desktop.chat.write.code')} />
      </div>
    );
  }
  const { added, removed } = countChanges(diff);
  return (
    <div>
      <strong>
        {existing?.code === input.code
          ? t('desktop.chat.write.noCodeChange')
          : t('desktop.chat.write.diff', String(added), String(removed))}
      </strong>
      <DiffView lines={diff} label={t('desktop.chat.write.diffLabel')} />
    </div>
  );
}

/** 承認カードのプレビュー(CSSのみ)。カードを閉じたら外す */
function PreviewButton(props: { code: string }) {
  const preview = useSyncExternalStore(cssPreview.subscribe, cssPreview.get);
  const active = preview?.source === 'approval' && preview.code === props.code;
  useEffect(
    () => () => {
      if (cssPreview.get()?.source === 'approval') cssPreview.clear();
    },
    []
  );
  return (
    <Button
      size='small'
      variant='outlined'
      aria-pressed={active}
      onClick={(event) => {
        if (!isTrustedEvent(event)) return;
        if (active) cssPreview.clear();
        else cssPreview.show('approval', props.code);
      }}
    >
      {active ? t('desktop.chat.preview.clear') : t('desktop.chat.write.preview')}
    </Button>
  );
}

function WriteAssetCard(props: { approval: PendingApproval; input: WriteAssetInput }) {
  const { approval, input } = props;
  const decide = useSetAtom(decideApprovalAtom);
  const assets = useAtomValue(panelAssetsLoadableAtom);
  const publishable = useAtomValue(canPublishLoadableAtom);
  const canPublish = publishable.state === 'hasData' && publishable.data;
  const validation = useMemo(
    () => validateWriteAssetInput(input, { origin: location.origin, checkJsSyntax }),
    [input]
  );
  const usedLines = useMemo(() => {
    const summary = summarizePermissionUsage(listAssetUsage(input, location.origin));
    return {
      post: summary.post.lines,
      put: summary.put.lines,
      delete: summary.delete.lines,
    };
  }, [input]);
  const unusedUrls = useMemo(
    () =>
      new Set(
        validation.warnings.flatMap((w) => (w.type === 'unused-external-url' ? [w.pattern] : []))
      ),
    [validation]
  );

  // 更新なら一覧の版を比べる。一覧を読み込み中なら`undefined`、無ければ`null`
  const existing: Asset | null | undefined =
    input.id === undefined
      ? undefined
      : assets.state === 'hasData'
        ? (assets.data.find((item) => item.asset.id === input.id)?.asset ?? null)
        : undefined;
  // 更新は、一覧で今の版を確かめられるまで承認させない(今の影響範囲・権限と比べて見せるため)
  const ready =
    publishable.state !== 'loading' && (input.id === undefined || assets.state === 'hasData');

  const isNew = input.id === undefined;
  const currentScope = existing?.scope;
  // 「全員」へ変えるには公開権限が要る。すでに「全員」のものはそのまま選べる(実行時と同じ条件)
  const publicSelectable = canPublish || currentScope === 'public';
  const requestedScope = input.scope ?? currentScope ?? 'private';
  const [scope, setScope] = useState<AssetScope | null>(null);
  const forcedPrivate = requestedScope === 'public' && !publicSelectable;
  const effectiveScope = scope ?? (forcedPrivate ? 'private' : requestedScope);
  const [enableAfterSave, setEnableAfterSave] = useState(false);
  const [keptPermissions, setKeptPermissions] = useState<AiWritePermission[]>(input.permissions);
  const [keptUrls, setKeptUrls] = useState<string[]>(validation.externalUrls);

  const kindLabel = t(`desktop.chat.write.kind.${input.kind}`);
  const override: ApprovalOverride = {
    // 更新では、利用者が選び直したとき・公開できないため落としたときだけ影響範囲を上書きする
    // (AIも利用者も変えるつもりのない更新で、影響範囲を変えない)
    ...(isNew || scope !== null || forcedPrivate ? { scope: effectiveScope } : {}),
    permissions: keptPermissions,
    externalUrls: keptUrls,
    ...(isNew && input.kind === 'css' ? { enableAfterSave } : {}),
  };

  return (
    <ApprovalFrame
      aria-label={t(isNew ? 'desktop.chat.write.titleCreate' : 'desktop.chat.write.titleUpdate')}
    >
      <h3>{t(isNew ? 'desktop.chat.write.titleCreate' : 'desktop.chat.write.titleUpdate')}</h3>
      <div>
        {isNew
          ? t('desktop.chat.write.subject', kindLabel, input.title)
          : t('desktop.chat.write.subjectUpdate', kindLabel, input.title, input.id ?? '')}
      </div>
      {input.description !== undefined && input.description.trim() !== '' && (
        <div>{t('desktop.chat.write.description', input.description)}</div>
      )}
      {input.screens !== undefined && input.screens.length > 0 && (
        <div>
          {t(
            'desktop.chat.write.screens',
            input.screens.map((screen) => t(SCREEN_KEYS[screen])).join(', ')
          )}
        </div>
      )}
      <CodeSection input={input} existing={existing} />
      <Blockers items={findBlockers(input, validation, existing)} />
      <Warnings items={validation.warnings.map(describeWarning)} />
      <ScopeChoice
        value={effectiveScope}
        requested={input.scope}
        canPublish={publicSelectable}
        onChange={setScope}
      />
      {isNew && input.kind === 'css' && (
        <FormControlLabel
          control={
            <Checkbox
              size='small'
              checked={enableAfterSave}
              onChange={(event) => setEnableAfterSave(event.target.checked)}
            />
          }
          label={t('desktop.chat.write.enableAfterSave')}
        />
      )}
      {isNew && input.kind === 'js' && <div>{t('desktop.chat.write.jsDisabled')}</div>}
      {!isNew && existing && (
        <div>
          {t(
            'desktop.chat.write.keepsState',
            t(existing.enabled ? 'desktop.chat.state.on' : 'desktop.chat.state.off')
          )}{' '}
          {existing.kind === 'js' && existing.enabled && t('desktop.chat.write.reloadAfterSave')}
        </div>
      )}
      {input.kind === 'js' && (
        <PermissionChoices
          requested={input.permissions}
          kept={keptPermissions}
          usedLines={usedLines}
          granted={existing ? aiPermissionsOf(existing.permissions) : null}
          onChange={setKeptPermissions}
        />
      )}
      <ExternalUrlChoices
        requested={validation.externalUrls}
        kept={keptUrls}
        unused={unusedUrls}
        granted={existing ? existing.externalUrls : null}
        onChange={setKeptUrls}
      />
      <ApprovalActions
        approveLabel={t(
          isNew ? 'desktop.chat.write.approveCreate' : 'desktop.chat.write.approveUpdate'
        )}
        ready={ready}
        onApprove={() => void decide({ approvalId: approval.approvalId, approved: true, override })}
        onDeny={(reason) =>
          void decide({ approvalId: approval.approvalId, approved: false, reason })
        }
        extra={input.kind === 'css' ? <PreviewButton code={input.code} /> : undefined}
      />
    </ApprovalFrame>
  );
}

/**
 * `write_asset`(登録・更新)の承認カード
 *
 * - 新規はコード全文、更新は既存との行単位の差分を見せる
 * - 影響範囲・保存後すぐ有効にするか(新規CSSのみ)・権限と送信先(減らす方向だけ)は利用者が最終決定する
 * - 承認画面で見せたコードと保存するコードは同じ(コードは上書きさせない)
 *
 * @see docs/07-ai-tools.md 5章、docs/06-ui.md 6章
 */
export function WriteApprovalCard(props: { approval: PendingApproval }) {
  const parsed = WriteAssetInputSchema.safeParse(props.approval.input);
  // SDKが入力を検証してから承認を求めるため通常は起きない。読めない要求は却下だけさせる
  if (!parsed.success) return <UnreadableApproval approval={props.approval} />;
  return <WriteAssetCard approval={props.approval} input={parsed.data} />;
}

/** 入力を読めない書き込みの要求(却下だけできる) */
export function UnreadableApproval(props: { approval: PendingApproval }) {
  const decide = useSetAtom(decideApprovalAtom);
  return (
    <ApprovalFrame aria-label={t('desktop.chat.write.blockers')}>
      <Blockers items={[t('desktop.chat.write.blocker.code', props.approval.toolName)]} />
      <ApprovalActions
        approveLabel={t('desktop.chat.write.approveCreate')}
        ready={false}
        onApprove={() => undefined}
        onDeny={(reason) =>
          void decide({ approvalId: props.approval.approvalId, approved: false, reason })
        }
      />
    </ApprovalFrame>
  );
}
