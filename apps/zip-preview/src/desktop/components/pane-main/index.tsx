import { LoaderWithLabel } from '@konomi-app/ui-react';
import { useAtomValue } from 'jotai';
import { FileX2 } from 'lucide-react';
import { Suspense } from 'react';
import { previewFileAtom } from '../../public-state';
import ZipFileContent from './content';
import { ZipFileName } from './zip-file-name';

function Placeholder() {
  return (
    <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>
      <LoaderWithLabel label='Zipファイルを解析しています' />
    </div>
  );
}

function ErrorPlaceholder() {
  return (
    <div className='rad:w-full rad:h-[60svh] rad:grid rad:place-items-center rad:text-foreground/70'>
      <div className='rad:p-4 rad:grid rad:place-items-center rad:gap-8'>
        <div>ファイルの読み込みに失敗しました。</div>
        <FileX2 className='rad:w-16 rad:h-16 rad:text-foreground/50' />
      </div>
    </div>
  );
}

function ZipPreviewComponent() {
  const content = useAtomValue(previewFileAtom);
  if (!content) {
    return <ErrorPlaceholder />;
  }

  // content が配列であることを確認
  const contentArray = Array.isArray(content) ? content : [content];

  return (
    <>
      {contentArray.map((fileContent, index) => (
        <ZipFileContent key={`${fileContent.path}-${index}`} content={fileContent} />
      ))}
    </>
  );
}

export default function PaneMain() {
  return (
    <div className='rad:overflow-auto rad:h-full rad:max-h-screen'>
      <ZipFileName />
      <div className='rad:p-4 '>
        <Suspense fallback={<Placeholder />}>
          <ZipPreviewComponent />
        </Suspense>
      </div>
    </div>
  );
}
