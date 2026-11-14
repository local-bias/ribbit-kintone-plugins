import { Button, Tooltip } from '@mui/material';
import { useSetAtom } from '@repo/jotai';
import type { MouseEvent } from 'react';
import type { AssetAccess } from '@/lib/asset-access';
import { t } from '@/lib/i18n';
import type { Asset } from '@/schema/asset';
import { deleteAssetAtom, duplicateAssetAtom } from '../states/asset-edit';
import { assetTitle } from './asset-labels';
import { useConfirm } from './confirm-dialog';
import { isTrustedEvent, useEditAction } from './use-edit-action';
import { useUnsavedGuard } from './use-unsaved-guard';

/**
 * 詳細画面の「複製」「削除」
 *
 * @see docs/06-ui.md 5章「詳細(コード表示)」
 */
export function AssetActions(props: { asset: Asset; access: AssetAccess }) {
  const { asset, access } = props;
  const duplicate = useSetAtom(duplicateAssetAtom);
  const remove = useSetAtom(deleteAssetAtom);
  const [confirm, dialog] = useConfirm();
  const guardUnsaved = useUnsavedGuard();
  const [busy, run] = useEditAction();

  const handleDuplicate = (event: MouseEvent) => {
    if (!isTrustedEvent(event)) return;
    // 複製は保存済みのコードで作り、複製したものを開く。編集中の変更は先に片付けてもらう
    if (!guardUnsaved()) return;
    void run(() => duplicate(asset));
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('desktop.detail.deleteTitle', assetTitle(asset)),
      body: (
        <>
          <p style={{ margin: 0 }}>{t('desktop.detail.deleteBody')}</p>
          {asset.kind === 'js' && <p style={{ margin: 0 }}>{t('desktop.detail.deleteBodyJs')}</p>}
        </>
      ),
      confirmLabel: t('desktop.detail.delete'),
      danger: true,
    });
    if (confirmed) await run(() => remove(asset));
  };

  const deleteButton = (
    <Button
      size='small'
      color='error'
      disabled={busy || !access.canDelete}
      onClick={() => void handleDelete()}
    >
      {t('desktop.detail.delete')}
    </Button>
  );

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
      <Button size='small' disabled={busy} onClick={handleDuplicate}>
        {t('desktop.detail.duplicate')}
      </Button>
      {access.canDelete ? (
        deleteButton
      ) : (
        <Tooltip title={t('desktop.detail.noDelete')}>
          <span>{deleteButton}</span>
        </Tooltip>
      )}
      {dialog}
    </div>
  );
}
