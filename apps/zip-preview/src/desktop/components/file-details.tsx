import { useAtomValue } from 'jotai';
import { File } from 'lucide-react';
import { selectedFileAtom, selectedFileContentKeyAtom } from '../public-state';
import { Suspense } from 'react';

function FileContent() {
  const content = useAtomValue(selectedFileAtom);
  if (!content) {
    return (
      <div className='rad:w-full rad:h-full rad:grid rad:place-items-center rad:gap-8 rad:py-16'>
        <File className='rad:w-12 rad:h-12 rad:text-foreground/30' />
        <p className='rad:text-gray-500'>ファイルが選択されていません</p>
      </div>
    );
  }
  return <pre className='rad:w-full rad:p-4 rad:bg-gray-100 rad:rounded'>{content}</pre>;
}

export default function FileDetails() {
  const key = useAtomValue(selectedFileContentKeyAtom);

  return (
    <div className='rad:p-4 rad:overflow-auto rad:h-full rad:max-h-screen rad:grid rad:grid-rows-[auto_1fr]'>
      <div>{key ?? 'ファイルが選択されていません'}</div>
      <Suspense
        fallback={
          <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>Loading...</div>
        }
      >
        <FileContent />
      </Suspense>
    </div>
  );
}
