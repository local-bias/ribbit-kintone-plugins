import { Drawer as MuiDrawer } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { handleDrawerCloseAtom, previewFileAtom, showDrawerAtom } from '../public-state';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { Suspense } from 'react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { FileX2 } from 'lucide-react';

function Placeholder() {
  return (
    <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>
      <LoaderWithLabel label='PDFを読み込んでいます' />
    </div>
  );
}

function ErrorPlaceholder() {
  return (
    <div className='rad:w-full rad:h-full rad:grid rad:place-items-center rad:text-foreground/70'>
      <div className='rad:p-4 rad:grid rad:place-items-center rad:gap-8'>
        <div>ファイルの読み込みに失敗しました。</div>
        <FileX2 className='rad:w-16 rad:h-16' />
      </div>
    </div>
  );
}

function PDFPreview() {
  const pdfFile = useAtomValue(previewFileAtom);
  if (!pdfFile) {
    return <ErrorPlaceholder />;
  }

  return (
    <iframe src={URL.createObjectURL(pdfFile)} className='rad:border-0 rad:w-full rad:h-full' />
  );
}

export default function Drawer() {
  const open = useAtomValue(showDrawerAtom);
  const onClose = useSetAtom(handleDrawerCloseAtom);

  return (
    <div>
      <MuiDrawer
        anchor='right'
        open={open}
        onClose={onClose}
        slotProps={{ paper: { className: 'rad:w-[80svw]' } }}
      >
        <PluginErrorBoundary>
          <Suspense fallback={<Placeholder />}>
            <PDFPreview />
          </Suspense>
        </PluginErrorBoundary>
      </MuiDrawer>
    </div>
  );
}
