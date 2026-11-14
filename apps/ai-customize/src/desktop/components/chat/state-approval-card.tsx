import { Button } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { loadable } from '@repo/jotai/utils';
import type { MouseEvent } from 'react';
import type { PendingApproval } from '@/lib/ai/chat-session';
import {
  aiPermissionsOf,
  DeleteAssetInputSchema,
  hasHumanOnlyPermissions,
  type SetAssetStateInput,
  SetAssetStateInputSchema,
} from '@/lib/ai/write-approval';
import { listAssetUsage, summarizePermissionUsage } from '@/lib/asset-usage';
import { validateAssetCode } from '@/lib/code-validator';
import { t } from '@/lib/i18n';
import type { Asset } from '@/schema/asset';
import { decideApprovalAtom } from '../../states/chat';
import { canPublishAtom, panelAssetsAtom } from '../../states/launcher';
import { assetTitle, formatLines, permissionChips } from '../asset-labels';
import { isTrustedEvent } from '../use-edit-action';
import { ApprovalActions, ApprovalFrame, Blockers, scopeLabel, Warnings } from './approval-parts';
import { describeWarning, UnreadableApproval } from './write-approval-card';

const panelAssetsLoadableAtom = loadable(panelAssetsAtom);
const canPublishLoadableAtom = loadable(canPublishAtom);

/** 一覧のアセット。読み込み中なら`undefined`、無ければ`null` */
const useListedAsset = (id: string): Asset | null | undefined => {
  const assets = useAtomValue(panelAssetsLoadableAtom);
  if (assets.state === 'loading') return undefined;
  if (assets.state === 'hasError') return null;
  return assets.data.find((item) => item.asset.id === id)?.asset ?? null;
};

const listOrNone = (values: readonly string[]): string =>
  values.length === 0 ? t('desktop.chat.state.none') : values.join(', ');

const permissionList = (permissions: readonly string[]): string =>
  listOrNone(permissions.map((permission) => t(`desktop.row.permission.${permission as 'post'}`)));

const onOff = (enabled: boolean) => t(enabled ? 'desktop.chat.state.on' : 'desktop.chat.state.off');

/** 変更の一覧(今の値 → 変更後) */
const describeChanges = (asset: Asset, input: SetAssetStateInput): string[] => [
  ...(input.enabled === undefined
    ? []
    : [t('desktop.chat.state.enabled', onOff(asset.enabled), onOff(input.enabled))]),
  ...(input.scope === undefined
    ? []
    : [t('desktop.chat.state.scope', scopeLabel(asset.scope), scopeLabel(input.scope))]),
  ...(input.order === undefined
    ? []
    : [t('desktop.chat.state.order', String(asset.order), String(input.order))]),
  ...(input.permissions === undefined
    ? []
    : [
        t(
          'desktop.chat.state.permissions',
          permissionList(aiPermissionsOf(asset.permissions)),
          permissionList(input.permissions)
        ),
      ]),
  ...(input.externalUrls === undefined
    ? []
    : [
        t(
          'desktop.chat.state.externalUrls',
          listOrNone(asset.externalUrls),
          listOrNone(input.externalUrls)
        ),
      ]),
];

/**
 * 権限・送信先を増やす変更の確認事項(使用箇所と、実行時に判定する呼び出し)
 *
 * 使っていない権限・送信先を増やす要求は実行時に拒否される(docs/07-ai-tools.md 4-11章)
 */
const describeGrantChanges = (asset: Asset, input: SetAssetStateInput): string[] => {
  if (input.permissions === undefined && input.externalUrls === undefined) return [];
  const validation = validateAssetCode({
    kind: asset.kind,
    code: asset.code,
    permissions: input.permissions ?? aiPermissionsOf(asset.permissions),
    externalUrls: input.externalUrls ?? asset.externalUrls,
    origin: location.origin,
    checkJsSyntax: () => null,
  });
  const summary = summarizePermissionUsage(listAssetUsage(asset, location.origin));
  const added = (input.permissions ?? []).filter((p) => !asset.permissions.includes(p));
  return [
    ...added.map((permission) => {
      const lines = summary[permission].lines;
      return `${t(`desktop.row.permission.${permission}`)} (${t('desktop.chat.write.newGrant')}) — ${
        lines.length === 0
          ? t('desktop.chat.write.unused')
          : t('desktop.chat.write.usedAt', formatLines(lines))
      }`;
    }),
    ...validation.warnings
      .filter(({ type }) => type !== 'credential' && type !== 'bulk-operation')
      .map(describeWarning),
  ];
};

function SetStateCard(props: { approval: PendingApproval; input: SetAssetStateInput }) {
  const { approval, input } = props;
  const decide = useSetAtom(decideApprovalAtom);
  const asset = useListedAsset(input.id);
  const publishable = useAtomValue(canPublishLoadableAtom);
  const changesGrants = input.permissions !== undefined || input.externalUrls !== undefined;
  const blockers =
    asset === undefined
      ? []
      : asset === null
        ? [t('desktop.chat.write.blocker.notFound')]
        : [
            ...(asset.revision === input.revision ? [] : [t('desktop.chat.write.blocker.stale')]),
            ...(changesGrants && hasHumanOnlyPermissions(asset.permissions)
              ? [t('desktop.chat.write.blocker.humanOnly')]
              : []),
            ...(input.scope === 'public' &&
            asset.scope !== 'public' &&
            publishable.state === 'hasData' &&
            !publishable.data
              ? [t('desktop.chat.write.noPublish')]
              : []),
          ];
  return (
    <ApprovalFrame aria-label={t('desktop.chat.state.title')}>
      <h3>{t('desktop.chat.state.title')}</h3>
      <div>{asset ? `${assetTitle(asset)} (#${asset.id})` : `#${input.id}`}</div>
      {asset && (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {describeChanges(asset, input).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {asset && (input.enabled === true || input.scope === 'public') && (
        <div>
          {t(
            'desktop.chat.write.currentPermissions',
            permissionChips(asset)
              .map(({ label }) => label)
              .join(', ') || t('desktop.chat.state.none')
          )}
        </div>
      )}
      {asset && <Warnings items={describeGrantChanges(asset, input)} />}
      {asset?.kind === 'js' && (input.enabled === true || input.order !== undefined) && (
        <div>{t('desktop.chat.write.reloadAfterSave')}</div>
      )}
      <Blockers items={blockers} />
      <ApprovalActions
        approveLabel={t('desktop.chat.state.approve')}
        ready={asset !== undefined && publishable.state !== 'loading'}
        onApprove={() =>
          void decide({ approvalId: approval.approvalId, approved: true, override: {} })
        }
        onDeny={(reason) =>
          void decide({ approvalId: approval.approvalId, approved: false, reason })
        }
      />
    </ApprovalFrame>
  );
}

/** `set_asset_state`(有効/無効・影響範囲・実行順・権限・送信先の変更)の承認カード */
export function StateApprovalCard(props: { approval: PendingApproval }) {
  const parsed = SetAssetStateInputSchema.safeParse(props.approval.input);
  if (!parsed.success) return <UnreadableApproval approval={props.approval} />;
  return <SetStateCard approval={props.approval} input={parsed.data} />;
}

/**
 * `delete_asset`の承認カード
 *
 * 削除より無効化のほうがほぼ常に良いため、「代わりに無効にする」を併記する(却下の理由として、AIに無効化を頼む)
 */
export function DeleteApprovalCard(props: { approval: PendingApproval }) {
  const { approval } = props;
  const decide = useSetAtom(decideApprovalAtom);
  const parsed = DeleteAssetInputSchema.safeParse(approval.input);
  const asset = useListedAsset(parsed.success ? parsed.data.id : '');
  if (!parsed.success) return <UnreadableApproval approval={approval} />;
  const { id, reason } = parsed.data;
  return (
    <ApprovalFrame aria-label={t('desktop.chat.delete.title')}>
      <h3>{t('desktop.chat.delete.title')}</h3>
      <div>{t('desktop.chat.delete.body', asset ? assetTitle(asset) : '', id)}</div>
      <div>{t('desktop.chat.delete.reason', reason)}</div>
      <Blockers items={asset === null ? [t('desktop.chat.write.blocker.notFound')] : []} />
      <ApprovalActions
        approveLabel={t('desktop.chat.delete.approve')}
        ready={asset !== undefined}
        onApprove={() =>
          void decide({ approvalId: approval.approvalId, approved: true, override: {} })
        }
        onDeny={(denyReason) =>
          void decide({ approvalId: approval.approvalId, approved: false, reason: denyReason })
        }
        extra={
          asset?.enabled ? (
            <Button
              size='small'
              variant='outlined'
              onClick={(event: MouseEvent) => {
                if (!isTrustedEvent(event)) return;
                void decide({
                  approvalId: approval.approvalId,
                  approved: false,
                  reason: t('desktop.chat.delete.disableInsteadReason'),
                });
              }}
            >
              {t('desktop.chat.delete.disableInstead')}
            </Button>
          ) : undefined
        }
      />
    </ApprovalFrame>
  );
}
