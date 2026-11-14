import { Button, Chip, Tooltip } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { loadable } from '@repo/jotai/utils';
import type { AssetAccess } from '@/lib/asset-access';
import {
  type AssetUsage,
  type PermissionUsageSummary,
  summarizePermissionUsage,
} from '@/lib/asset-usage';
import { t } from '@/lib/i18n';
import type { Asset, AssetPermission, AssetScope } from '@/schema/asset';
import { saveAssetAtom } from '../states/asset-edit';
import { canPublishAtom } from '../states/launcher';
import { assetTitle, formatLines, permissionChips } from './asset-labels';
import { useConfirm } from './confirm-dialog';
import { useEditAction } from './use-edit-action';

const canPublishLoadableAtom = loadable(canPublishAtom);

const USAGE_KEY: Record<AssetPermission, keyof PermissionUsageSummary> = {
  post: 'post',
  put: 'put',
  delete: 'delete',
  'external-listed': 'external',
  'external-all': 'external',
  unrestricted: 'unrestricted',
};

/**
 * 公開の確認に出す、付与済みの権限とそれを使うコードの行
 *
 * 公開する人が権限の内容も承認することになるため、名前だけでなく使用箇所を並べる(docs/13 3-5章)
 */
function PublishSummary(props: { asset: Asset; usage: readonly AssetUsage[] }) {
  const { asset } = props;
  const summary = summarizePermissionUsage(props.usage);
  const chips = permissionChips(asset);
  const blockedBypass =
    summary.unrestricted.lines.length > 0 && !asset.permissions.includes('unrestricted');
  return (
    <>
      <p style={{ margin: 0 }}>{t('desktop.scope.publishBody')}</p>
      {chips.length === 0 ? (
        <p style={{ margin: 0 }}>
          {t('desktop.scope.publishPermissions', t('desktop.detail.permissions.readOnly'))}
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {asset.permissions.map((permission, index) => {
            const used = summary[USAGE_KEY[permission]];
            const lines = [...used.lines, ...used.dynamicLines];
            return (
              <li key={permission}>
                {chips[index]?.caution ? '⚠ ' : ''}
                {chips[index]?.label}:{' '}
                {lines.length === 0
                  ? t('desktop.perm.unused')
                  : t('desktop.perm.used', formatLines(lines))}
              </li>
            );
          })}
        </ul>
      )}
      {blockedBypass && (
        <p style={{ margin: 0 }}>
          ⚠ {t('desktop.scope.publishBypass', formatLines(summary.unrestricted.lines))}
        </p>
      )}
    </>
  );
}

const scopeLabel = (scope: AssetScope) =>
  t(scope === 'public' ? 'desktop.row.scope.public' : 'desktop.row.scope.private');

/**
 * 影響範囲の表示と変更
 *
 * 「全員」にするには公開権限が要り、権限と合わせて確認してから保存する。「自分だけ」へ戻すのは確認しない
 *
 * @see docs/06-ui.md 5章・7章、docs/08-security.md 2-2章
 */
export function ScopeControl(props: {
  asset: Asset;
  access: AssetAccess;
  usage: readonly AssetUsage[];
}) {
  const { asset, access, usage } = props;
  const publishable = useAtomValue(canPublishLoadableAtom);
  const save = useSetAtom(saveAssetAtom);
  const [confirm, dialog] = useConfirm();
  const [busy, run] = useEditAction();

  const next: AssetScope = asset.scope === 'public' ? 'private' : 'public';
  const canPublish = publishable.state === 'hasData' && publishable.data;
  const disabledReason = !access.canChangeScope
    ? t('desktop.scope.noPermission')
    : next === 'public' && !canPublish
      ? t('desktop.scope.noPublish')
      : '';

  const handleClick = async () => {
    if (next === 'public') {
      const confirmed = await confirm({
        title: t('desktop.scope.publishTitle', assetTitle(asset)),
        body: <PublishSummary asset={asset} usage={usage} />,
        confirmLabel: t('desktop.scope.publish'),
        danger: true,
      });
      if (!confirmed) return;
    }
    await run(() => save({ asset, patch: { scope: next } }));
  };

  const button = (
    <Button
      size='small'
      // 「自分だけ」へ戻すのは公開権限の判定を待たない
      disabled={
        busy || disabledReason !== '' || (next === 'public' && publishable.state === 'loading')
      }
      onClick={() => void handleClick()}
    >
      {t('desktop.scope.change', scopeLabel(next))}
    </Button>
  );

  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <Chip
        size='small'
        variant={asset.scope === 'public' ? 'filled' : 'outlined'}
        color={asset.scope === 'public' ? 'primary' : 'default'}
        label={scopeLabel(asset.scope)}
      />
      {disabledReason === '' ? (
        button
      ) : (
        <Tooltip title={disabledReason}>
          <span>{button}</span>
        </Tooltip>
      )}
      {dialog}
    </span>
  );
}
