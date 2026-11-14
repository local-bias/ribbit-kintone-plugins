import { Alert, Switch, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import type { ReactNode } from 'react';
import type { AssetAccess } from '@/lib/asset-access';
import {
  type ExternalMode,
  externalModeOf,
  type SwitchPermission,
  widensPermissions,
  withExternalMode,
  withPermission,
} from '@/lib/asset-grants';
import {
  type AssetUsage,
  findUnregisteredTargets,
  type PermissionUsage,
  summarizePermissionUsage,
} from '@/lib/asset-usage';
import { t } from '@/lib/i18n';
import type { Asset, AssetPatch, AssetPermission } from '@/schema/asset';
import { saveAssetAtom } from '../states/asset-edit';
import { servicesAtom } from '../states/launcher';
import { formatLines } from './asset-labels';
import { useConfirm } from './confirm-dialog';
import { ExternalUrlEditor } from './external-url-editor';
import { useEditAction } from './use-edit-action';

export const PERMISSIONS_SECTION_ID = 'ai-customize-permissions';

const Rows = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(8em, max-content) auto 1fr',
  alignItems: 'center',
  gap: '2px 8px',
  '& > .full': { gridColumn: '1 / -1' },
  '& .usage': { color: theme.palette.text.secondary, fontSize: 12 },
  '& .usage.unused': { color: theme.palette.text.disabled },
  '& .usage.danger': { color: theme.palette.error.main, fontWeight: 600 },
}));

const SWITCH_KEYS: Record<SwitchPermission, Parameters<typeof t>[0]> = {
  post: 'desktop.perm.post',
  put: 'desktop.perm.put',
  delete: 'desktop.perm.delete',
  unrestricted: 'desktop.perm.unrestricted',
};

const describeUsage = (usage: PermissionUsage): string =>
  [
    usage.lines.length > 0 ? t('desktop.perm.used', formatLines(usage.lines)) : '',
    usage.dynamicLines.length > 0 ? t('desktop.perm.dynamic', formatLines(usage.dynamicLines)) : '',
  ]
    .filter(Boolean)
    .join(' / ') || t('desktop.perm.unused');

/** 付与の確認ダイアログの本文。その権限を使う行(使っていなければその旨)と、付与の重みを示す */
const grantBody = (params: {
  asset: Asset;
  usage: PermissionUsage;
  permission: SwitchPermission | 'external-listed' | 'external-all';
}): ReactNode => {
  const { asset, usage, permission } = params;
  const paragraphs = [
    usage.lines.length > 0
      ? t('desktop.perm.grantUsed', formatLines(usage.lines))
      : t('desktop.perm.grantUnused'),
    usage.dynamicLines.length > 0
      ? t('desktop.perm.grantDynamic', formatLines(usage.dynamicLines))
      : '',
    permission === 'unrestricted' ? t('desktop.perm.grantUnrestricted') : '',
    permission === 'external-all' ? t('desktop.perm.grantExternalAll') : '',
    asset.scope === 'public' ? t('desktop.perm.grantPublic') : '',
  ].filter(Boolean);
  return paragraphs.map((text) => (
    <p key={text} style={{ margin: 0 }}>
      {text}
    </p>
  ));
};

/**
 * カスタマイズ単位の権限(スイッチ・外部通信の3択・通信先)
 *
 * - 付与(できることが増える変更)は、その権限を使う行を示して確認してから保存する
 * - 取り消しは安全側なので確認しない。このタブのファサードには保存後すぐに効く
 *
 * @see docs/06-ui.md 5章「権限(カスタマイズ単位)」、docs/13-launch-gate-and-permissions.md 3-6章
 */
export function PermissionSection(props: {
  asset: Asset;
  access: AssetAccess;
  usage: readonly AssetUsage[];
}) {
  const { asset, access, usage } = props;
  const services = useAtomValue(servicesAtom);
  const save = useSetAtom(saveAssetAtom);
  const [confirm, dialog] = useConfirm();
  const [busy, run] = useEditAction();

  const summary = summarizePermissionUsage(usage);
  const mode = externalModeOf(asset.permissions);
  const urlsMapped = (services?.common.externalUrlsFieldCode ?? '') !== '';
  const editable = access.canEditPermissions && !busy;

  const submit = async (patch: AssetPatch): Promise<boolean> =>
    (await run(() => save({ asset, patch })))?.variant === 'success';

  const change = async (
    next: AssetPermission[],
    permission: SwitchPermission | 'external-listed' | 'external-all',
    label: string
  ) => {
    if (widensPermissions(asset.permissions, next)) {
      const usageOf =
        permission === 'external-listed' || permission === 'external-all'
          ? summary.external
          : summary[permission];
      const confirmed = await confirm({
        title: t('desktop.perm.grantTitle', label),
        body: grantBody({ asset, usage: usageOf, permission }),
        confirmLabel: t('desktop.perm.grant'),
        danger: permission === 'unrestricted' || permission === 'external-all',
      });
      if (!confirmed) return;
    }
    await submit({ permissions: next });
  };

  const withTooltip = (control: ReactNode, enabled: boolean) =>
    enabled ? (
      control
    ) : (
      <Tooltip title={t('desktop.perm.noPermission')}>
        <span>{control}</span>
      </Tooltip>
    );

  const switchRow = (permission: SwitchPermission) => {
    const label = t(SWITCH_KEYS[permission]);
    const granted = asset.permissions.includes(permission);
    const usageOf = summary[permission];
    const unused = usageOf.lines.length === 0 && usageOf.dynamicLines.length === 0;
    return (
      <div key={permission} style={{ display: 'contents' }}>
        <span>{label}</span>
        {withTooltip(
          <Switch
            size='small'
            checked={granted}
            disabled={!editable}
            onChange={(_, checked) =>
              void change(withPermission(asset.permissions, permission, checked), permission, label)
            }
            slotProps={{ input: { 'aria-label': label } }}
          />,
          access.canEditPermissions
        )}
        <span
          className={`usage${unused ? ' unused' : ''}${permission === 'unrestricted' && !unused ? ' danger' : ''}`}
        >
          {permission === 'unrestricted' && !unused
            ? `⚠ ${t('desktop.perm.bypassLines', formatLines(usageOf.lines))}`
            : describeUsage(usageOf)}
        </span>
      </div>
    );
  };

  const externalLabel = (value: ExternalMode) => t(`desktop.perm.external.${value}`);

  return (
    <section
      id={PERMISSIONS_SECTION_ID}
      aria-label={t('desktop.perm.title')}
      style={{ display: 'grid', gap: 8 }}
    >
      <Rows>
        <span>{t('desktop.perm.read')}</span>
        <span />
        <span className='usage'>{t('desktop.perm.readAlways')}</span>
        {(['post', 'put', 'delete'] as const).map(switchRow)}
        <span>{t('desktop.perm.external')}</span>
        <div style={{ gridColumn: '2 / -1' }}>
          {withTooltip(
            <ToggleButtonGroup
              size='small'
              exclusive
              value={mode}
              disabled={!editable}
              aria-label={t('desktop.perm.external')}
              onChange={(_, value: ExternalMode | null) => {
                if (value === null || value === mode) return;
                const permission = value === 'all' ? 'external-all' : 'external-listed';
                void change(
                  withExternalMode(asset.permissions, value),
                  permission,
                  `${t('desktop.perm.external')}(${externalLabel(value)})`
                );
              }}
            >
              {(['none', 'listed', 'all'] as const).map((value) => (
                <ToggleButton key={value} value={value} sx={{ px: 1.5, py: 0.25 }}>
                  {value === 'all' ? `⚠ ${externalLabel(value)}` : externalLabel(value)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>,
            access.canEditPermissions
          )}{' '}
          <span className='usage'>{describeUsage(summary.external)}</span>
        </div>
        <div className='full'>
          {urlsMapped ? (
            <ExternalUrlEditor
              asset={asset}
              usage={usage}
              unregistered={
                mode === 'all' ? [] : findUnregisteredTargets(usage, asset.externalUrls)
              }
              editable={access.canEditExternalUrls}
              inactive={mode !== 'listed'}
              busy={busy}
              save={(externalUrlsText) => submit({ externalUrlsText })}
              confirm={confirm}
            />
          ) : (
            <Alert severity='info'>{t('desktop.urls.notMapped')}</Alert>
          )}
        </div>
        {switchRow('unrestricted')}
      </Rows>
      <Alert severity='info' icon={<span aria-hidden='true'>ⓘ</span>}>
        {t('desktop.perm.notice')}
      </Alert>
      {dialog}
    </section>
  );
}
