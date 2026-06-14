import { Button } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { previewBlobAtom, previewFileNameAtom } from '../public-state';
import { useObjectUrl } from './use-object-url';

function DownloadButton() {
  const blob = useAtomValue(previewBlobAtom);
  const fileName = useAtomValue(previewFileNameAtom);
  const url = useObjectUrl(blob);

  if (!blob || !url) {
    return null;
  }

  return (
    <a href={url} download={fileName?.split('/').pop() ?? 'download'}>
      <Button variant='contained' size='small' color='primary' className='rad:truncate'>
        このファイルをダウンロード
      </Button>
    </a>
  );
}

export default function Footer() {
  return (
    <div className='rad:flex rad:justify-end rad:p-4 rad:border-t rad:border-border rad:bg-background'>
      <Suspense
        fallback={
          <Button variant='contained' size='small' color='primary' disabled>
            このファイルをダウンロード
          </Button>
        }
      >
        <DownloadButton />
      </Suspense>
    </div>
  );
}
