import { useAtomValue } from 'jotai';
import { File } from 'lucide-react';
import { selectedFileAtom, selectedFileContentKeyAtom } from '../public-state';
import { Suspense } from 'react';

function FileContent() {
  const content = useAtomValue(selectedFileAtom);
  if (!content) {
    return <div className='rad:w-full rad:h-full rad:grid rad:place-items-center'>No content</div>;
  }
  return <pre className='rad:w-full rad:p-4 rad:bg-gray-100 rad:rounded'>{content}</pre>;
}

export default function FileDetails() {
  const key = useAtomValue(selectedFileContentKeyAtom);

  return (
    <div className='rad:grid rad:place-items-center rad:gap-4 rad:p-4'>
      <File className='rad:w-12 rad:h-12 rad:text-foreground/30' />
      <h3 className='rad:text-lg rad:font-bold rad:mb-4'>ファイルの詳細</h3>
      {key}
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
