import { IconButton } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { File as FileIcon, X } from 'lucide-react';
import { previewFileNameAtom, previewKindAtom } from '../public-state';
import { getPreviewKindLabel } from '@/lib/preview';
import { handleDrawerCloseAtom } from '../states/drawer';

export default function Header() {
  const fileName = useAtomValue(previewFileNameAtom);
  const kind = useAtomValue(previewKindAtom);
  const onClose = useSetAtom(handleDrawerCloseAtom);

  return (
    <div className='rad:flex rad:items-center rad:gap-3 rad:px-4 rad:py-3 rad:border-b rad:border-border rad:bg-background'>
      <FileIcon className='rad:w-5 rad:h-5 rad:text-foreground/60 rad:shrink-0' />
      <div className='rad:flex-1 rad:min-w-0'>
        <div className='rad:truncate rad:font-medium'>
          {fileName ?? 'ファイルが選択されていません'}
        </div>
        {kind && (
          <div className='rad:text-xs rad:text-foreground/50'>{getPreviewKindLabel(kind)}</div>
        )}
      </div>
      <IconButton size='small' onClick={onClose} aria-label='閉じる'>
        <X className='rad:w-5 rad:h-5' />
      </IconButton>
    </div>
  );
}
