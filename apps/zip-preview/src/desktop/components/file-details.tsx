import { File } from 'lucide-react';

export default function FileDetails() {
  return (
    <div className='rad:grid rad:place-items-center rad:gap-4 rad:p-4'>
      <File className='rad:w-12 rad:h-12 rad:text-foreground/30' />
      <h3 className='rad:text-lg rad:font-bold rad:mb-4'>ファイルの詳細</h3>
    </div>
  );
}
