import { detailFileBlobAtom, selectedFileDetailsAtom } from '@/desktop/public-state';
import { Button } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Suspense } from 'react';

function DownloadButton() {
  const content = useAtomValue(selectedFileDetailsAtom);
  const blob = useAtomValue(detailFileBlobAtom);

  if (!blob || !content) {
    return null;
  }

  return (
    <a href={URL.createObjectURL(blob)} download={content.name.split('/').pop()}>
      <Button variant='contained' size='small' color='primary' className='rad:truncate'>
        このファイルをダウンロード
      </Button>
    </a>
  );
}

export default function DetailFooter() {
  return (
    <div className='rad:flex rad:justify-end rad:p-4'>
      <Suspense
        fallback={
          <Button
            variant='contained'
            size='small'
            color='primary'
            disabled
            className='rad:truncate'
          >
            このファイルをダウンロード
          </Button>
        }
      >
        <DownloadButton />
      </Suspense>
    </div>
  );
}
