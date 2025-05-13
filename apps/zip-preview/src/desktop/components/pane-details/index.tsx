import { Loader } from '@konomi-app/ui-react';
import { useAtomValue } from 'jotai';
import { File, FileX2 } from 'lucide-react';
import { Suspense } from 'react';
import { selectedFileDetailsAtom } from '../../public-state';
import DetailFooter from './footer';
import DetailHeader from './header';

function FileContent() {
  const content = useAtomValue(selectedFileDetailsAtom);
  if (!content) {
    return (
      <div className='rad:w-full rad:h-full rad:grid rad:place-items-center rad:gap-8 rad:py-16'>
        <div className='rad:flex rad:flex-col rad:items-center rad:gap-4 rad:text-foreground/30'>
          <File className='rad:w-12 rad:h-12' />
          <p className='rad:text-sm'>アイテムを選択すると詳細が表示されます</p>
        </div>
      </div>
    );
  }

  // const details = (
  //   <div className='rad:py-4 rad:space-y-4'>
  //     <div>
  //       <div className='rad:text-xs rad:mb-1'>ファイル名</div>
  //       <div className='rad:text-xs rad:text-foreground/70'>{content.name}</div>
  //     </div>
  //     <div>
  //       <div className='rad:text-xs rad:mb-1'>ファイルサイズ</div>
  //       <div className='rad:text-xs rad:text-foreground/70'>{formatFileSize(content.size)}</div>
  //     </div>
  //   </div>
  // );

  if (content.content.type === 'image') {
    return (
      <div className='rad:w-full rad:h-full'>
        <img
          src={URL.createObjectURL(content.content.value)}
          alt={content.name}
          className='rad:h-full rad:max-w-full rad:object-contain'
        />
      </div>
    );
  } else if (content.content.type === 'blob') {
    return (
      <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>
        <div className='rad:flex rad:flex-col rad:items-center rad:gap-4 rad:text-foreground/30'>
          <FileX2 className='rad:w-12 rad:h-12' />
          <p className='rad:text-sm'>このファイルは詳細表示に対応していません。</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <pre className='rad:w-full rad:text-xs! rad:font-mono! rad:p-4 rad:bg-gray-100 rad:rounded'>
        {content.content.value}
      </pre>
    </div>
  );
}

export default function PaneDetails() {
  return (
    <div className='rad:overflow-hidden rad:h-full rad:max-h-screen rad:grid rad:grid-rows-[auto_1fr_auto]'>
      <DetailHeader />
      <div className='rad:p-4 rad:overflow-auto'>
        <Suspense
          fallback={
            <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>
              <Loader className='rad:text-4xl' />
            </div>
          }
        >
          <FileContent />
        </Suspense>
      </div>
      <DetailFooter />
    </div>
  );
}
