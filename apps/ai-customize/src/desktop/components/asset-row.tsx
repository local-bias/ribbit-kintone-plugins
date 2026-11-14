import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Chip, Switch, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import type { ChangeEvent } from 'react';
import type { AssetRow as AssetRowModel } from '@/lib/asset-panel';
import { decideToggle } from '@/lib/asset-toggle';
import { LANGUAGE } from '@/lib/global';
import { t } from '@/lib/i18n';
import { formatRelativeTime } from '@/lib/relative-time';
import {
  pendingReloadIdsAtom,
  selectedAssetIdAtom,
  servicesAtom,
  toggleAssetAtom,
} from '../states/launcher';
import { assetTitle, permissionChips, problemLabel } from './asset-labels';
import { isTrustedEvent, useEditAction } from './use-edit-action';

const Item = styled('li')(({ theme }) => ({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: '2px 8px',
  padding: '10px 8px 10px 4px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.background.paper,
  '&[data-dragging="true"]': { zIndex: 1, boxShadow: theme.shadows[4] },
}));

/** ドラッグハンドル。行全体を掴めるようにすると、開くつもりが動いてしまうため、ここだけを掴む */
const Handle = styled('button')(({ theme }) => ({
  gridRow: '1 / span 2',
  width: 32,
  minHeight: 44,
  margin: 0,
  padding: 0,
  border: 0,
  borderRadius: 4,
  background: 'none',
  color: theme.palette.text.secondary,
  font: 'inherit',
  fontSize: 16,
  lineHeight: 1,
  cursor: 'grab',
  touchAction: 'none',
  '&:hover:not(:disabled)': { background: theme.palette.action.hover },
  '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
  '&:disabled': { color: theme.palette.text.disabled, cursor: 'not-allowed' },
}));

const TitleButton = styled('button')(({ theme }) => ({
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
  background: 'none',
  color: theme.palette.text.primary,
  font: 'inherit',
  fontWeight: 600,
  textAlign: 'left',
  overflowWrap: 'anywhere',
  cursor: 'pointer',
  '&:hover': { textDecoration: 'underline' },
  '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
}));

const Meta = styled('div')(({ theme }) => ({
  gridColumn: '2 / -1',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 4,
  color: theme.palette.text.secondary,
  fontSize: 12,
}));

const Problem = styled('span')(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 600,
}));

/** 並べ替えの可否。`lockedReason`が空でなければ、ハンドルを無効にして理由を出す */
export type RowReorder = { enabled: boolean; lockedReason: string };

/** 一覧の1行(ドラッグハンドル・タイトル・影響範囲・有効スイッチ・権限・状態) */
export function AssetRow(props: { row: AssetRowModel; reorder: RowReorder }) {
  const { row, reorder } = props;
  const { asset } = row;
  const sortable = useSortable({ id: asset.id, disabled: !reorder.enabled });
  const services = useAtomValue(servicesAtom);
  const pendingReload = useAtomValue(pendingReloadIdsAtom);
  const select = useSetAtom(selectedAssetIdAtom);
  const toggle = useSetAtom(toggleAssetAtom);
  const [busy, run] = useEditAction();

  const title = assetTitle(asset);
  const action = decideToggle({ enabled: asset.enabled, muted: row.muted, access: row.access });
  const disabledReason =
    action.type === 'forbidden'
      ? t(
          action.reason === 'unavailable'
            ? 'desktop.toggle.unavailable'
            : 'desktop.toggle.noPermission'
        )
      : action.type === 'mute'
        ? t(
            row.access.unavailable
              ? 'desktop.panel.unavailableHint'
              : 'desktop.panel.noPermissionHint'
          )
        : '';
  const isSelf = asset.ownerCode !== '' && asset.ownerCode === services?.loginUserCode;
  const updated =
    row.updatedAt === null ? '' : formatRelativeTime(row.updatedAt, new Date(), LANGUAGE ?? 'ja');

  const handleToggle = (event: ChangeEvent) => {
    // 有効にする(できることが増える)操作は、利用者の操作によるものだけを受け付ける
    if (!row.switchedOn && !isTrustedEvent(event)) return;
    void run(() => toggle({ asset, muted: row.muted, access: row.access }));
  };

  const toggleSwitch = (
    <Switch
      checked={row.switchedOn}
      onChange={handleToggle}
      disabled={busy || action.type === 'forbidden'}
      slotProps={{ input: { 'aria-label': t('desktop.row.toggle', title) } }}
    />
  );

  const handle = (
    <Handle
      type='button'
      ref={sortable.setActivatorNodeRef}
      disabled={!reorder.enabled}
      aria-label={t('desktop.order.handle', title)}
      {...sortable.attributes}
      {...sortable.listeners}
    >
      <span aria-hidden='true'>⋮⋮</span>
    </Handle>
  );

  return (
    <Item
      ref={sortable.setNodeRef}
      data-dragging={sortable.isDragging}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
    >
      <Tooltip title={reorder.lockedReason || t('desktop.order.hint')} placement='left'>
        <span style={{ gridRow: '1 / span 2', alignSelf: 'stretch', display: 'flex' }}>
          {handle}
        </span>
      </Tooltip>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <TitleButton
          type='button'
          onClick={() => select(asset.id)}
          aria-label={t('desktop.row.openDetail', title)}
        >
          {title}
        </TitleButton>
        <Chip
          size='small'
          variant={asset.scope === 'public' ? 'filled' : 'outlined'}
          color={asset.scope === 'public' ? 'primary' : 'default'}
          label={t(
            asset.scope === 'public' ? 'desktop.row.scope.public' : 'desktop.row.scope.private'
          )}
        />
        {permissionChips(asset).map((chip) => (
          <Chip
            key={chip.label}
            size='small'
            variant='outlined'
            color={chip.caution ? 'warning' : 'default'}
            label={chip.caution ? `⚠ ${chip.label}` : chip.label}
          />
        ))}
      </div>
      {disabledReason === '' ? (
        toggleSwitch
      ) : (
        <Tooltip title={disabledReason}>
          <span>{toggleSwitch}</span>
        </Tooltip>
      )}
      <Meta>
        <span>
          {[`#${asset.id}`, isSelf ? t('desktop.row.owner.self') : row.ownerName, updated]
            .filter(Boolean)
            .join(' · ')}
        </span>
        {row.muted && <span>· {t('desktop.row.muted')}</span>}
        {pendingReload.has(asset.id) && <span>· {t('desktop.row.reloadToApply')}</span>}
        {row.problems.map((problem) => (
          <Problem key={problem}>⚠ {problemLabel(problem)}</Problem>
        ))}
      </Meta>
    </Item>
  );
}
