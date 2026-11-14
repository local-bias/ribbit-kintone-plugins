import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Alert, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { canReorderAll } from '@/lib/asset-order';
import { type AssetRow as AssetRowModel, buildAssetRows, countApplied } from '@/lib/asset-panel';
import { MAX_ASSETS_PER_APP } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { AssetKind } from '@/schema/asset';
import { draggingAtom, reorderAssetsAtom, reorderingAtom } from '../states/asset-edit';
import {
  mutedIdsAtom,
  panelAccessAtom,
  panelAssetsAtom,
  panelDataAtom,
  runtimeViewAtom,
} from '../states/launcher';
import { assetTitle } from './asset-labels';
import { AssetRow, type RowReorder } from './asset-row';
import { useEditAction } from './use-edit-action';

const List = styled('ul')({ listStyle: 'none', margin: 0, padding: 0 });

/** ポインターで少し動かしてから掴む(クリックやスクロールと区別する) */
const DRAG_ACTIVATION_DISTANCE = 4;

/**
 * ドラッグで実行順を並べ替えられる一覧
 *
 * 種別をまたがず、縦方向・一覧の中だけで動かす。キーボードでも掴んで矢印キーで動かせる
 *
 * @see docs/06-ui.md 5章「実行順の並び替え(ドラッグ&ドロップ)」
 */
function SortableAssetList(props: { kind: AssetKind; rows: readonly AssetRowModel[] }) {
  const { kind, rows } = props;
  const reorder = useSetAtom(reorderAssetsAtom);
  const reordering = useAtomValue(reorderingAtom);
  const setDragging = useSetAtom(draggingAtom);
  const [, run] = useEditAction();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const reorderable = canReorderAll(rows.map((row) => row.access));
  const rowReorder: RowReorder = {
    enabled: reorderable && !reordering,
    lockedReason: reorderable || rows.length < 2 ? '' : t('desktop.order.locked'),
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(false);
    if (over === null || active.id === over.id) return;
    const ids = rows.map((row) => row.asset.id);
    void run(() =>
      reorder({ kind, from: ids.indexOf(String(active.id)), to: ids.indexOf(String(over.id)) })
    );
  };

  const titleOf = (id: UniqueIdentifier) =>
    assetTitle(rows.find((row) => row.asset.id === String(id))?.asset ?? { title: '' });
  const positionOf = (id: UniqueIdentifier | undefined) =>
    String(rows.findIndex((row) => row.asset.id === String(id)) + 1);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(false)}
      accessibility={{
        screenReaderInstructions: { draggable: t('desktop.order.hint') },
        announcements: {
          onDragStart: ({ active }) => t('desktop.order.announce.start', titleOf(active.id)),
          onDragOver: ({ active, over }) =>
            t('desktop.order.announce.over', titleOf(active.id), positionOf(over?.id)),
          onDragEnd: ({ active, over }) =>
            over === null
              ? t('desktop.order.announce.cancel', titleOf(active.id))
              : t('desktop.order.announce.end', titleOf(active.id), positionOf(over.id)),
          onDragCancel: ({ active }) => t('desktop.order.announce.cancel', titleOf(active.id)),
        },
      }}
    >
      <SortableContext
        items={rows.map((row) => row.asset.id)}
        strategy={verticalListSortingStrategy}
      >
        <List>
          {rows.map((row) => (
            <AssetRow key={row.asset.id} row={row} reorder={rowReorder} />
          ))}
        </List>
      </SortableContext>
    </DndContext>
  );
}

const Footer = styled('footer')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginTop: 'auto',
  padding: '8px 16px',
  borderTop: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  fontSize: 12,
}));

const Empty = styled('p')(({ theme }) => ({
  margin: 0,
  padding: '32px 16px',
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));

/**
 * JS / CSSの一覧
 *
 * @see docs/06-ui.md 5章
 */
export function AssetList(props: { kind: AssetKind }) {
  const data = useAtomValue(panelDataAtom);
  const assets = useAtomValue(panelAssetsAtom);
  const access = useAtomValue(panelAccessAtom);
  const mutedIds = useAtomValue(mutedIdsAtom);
  const view = useAtomValue(runtimeViewAtom);

  const rows = buildAssetRows({
    assets,
    kind: props.kind,
    mutedIds,
    appliedIds: props.kind === 'js' ? view.applied.js : view.applied.css,
    access,
    problems: view.problems,
  });
  const { applied, total } = countApplied(rows);

  return (
    <>
      {data?.truncated && (
        <Alert severity='warning' square>
          {t('desktop.panel.truncated', String(MAX_ASSETS_PER_APP))}
        </Alert>
      )}
      {(data?.skipped.length ?? 0) > 0 && (
        <Alert severity='warning' square>
          {t('desktop.panel.skipped', String(data?.skipped.length ?? 0))}
        </Alert>
      )}
      {rows.length === 0 ? (
        <Empty>
          {t(props.kind === 'js' ? 'desktop.panel.empty.js' : 'desktop.panel.empty.css')}
        </Empty>
      ) : (
        <SortableAssetList kind={props.kind} rows={rows} />
      )}
      <Footer>
        <span>{t('desktop.panel.footer', String(applied), String(total))}</span>
        <Button size='small' onClick={() => location.reload()}>
          {t('desktop.panel.reload')}
        </Button>
      </Footer>
    </>
  );
}
