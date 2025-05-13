import { selectedFileContentKeyAtom } from '@/desktop/public-state';
import { useAtomValue } from 'jotai';

export default function DetailHeader() {
  const key = useAtomValue(selectedFileContentKeyAtom);

  return (
    <div className='rad:h-14 rad:flex rad:items-end rad:py-2 rad:pt-4 rad:px-4 rad:truncate'>
      {key ?? 'ファイルが選択されていません'}
    </div>
  );
}
