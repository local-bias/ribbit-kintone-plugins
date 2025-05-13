import { useAtomValue } from 'jotai';
import { FolderArchive } from 'lucide-react';
import { previewZipFileNameAtom } from '../../public-state';

export function ZipFileName() {
  const fileName = useAtomValue(previewZipFileNameAtom) ?? 'ファイル名がありません';
  if (!fileName) {
    return null;
  }

  return (
    <div className='rad:h-14 rad:flex rad:items-end rad:sticky rad:top-0 rad:z-10 rad:bg-background rad:text-lg rad:border-b rad:border-border'>
      <div className='rad:flex rad:items-center rad:gap-2 rad:py-2 rad:pt-4 rad:px-4'>
        <FolderArchive className='rad:w-6 rad:h-6 rad:text-amber-500' />
        <div className='rad:truncate'>{fileName}</div>
      </div>
    </div>
  );
}
