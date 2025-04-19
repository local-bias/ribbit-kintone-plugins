import { handleFileDropAtom } from '@/lib/global-states';
import { Loader } from '@konomi-app/ui-react';
import { loadingAtom } from '@repo/jotai/index';
import { useAtomValue, useSetAtom } from 'jotai';
import { Image } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

function DropzoneContent() {
  const loading = useAtomValue(loadingAtom);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center gap-4 text-foreground/50 text-xs'>
        <Loader className='text-2xl' />
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center gap-4 text-foreground/50 text-xs'>
      <Image strokeWidth={1} className='w-10 h-10' />
      <div className='flex flex-col items-center justify-center gap-1'>
        <div>クリックしてファイルを選択</div>
        <div className='text-foreground/30 text-[10px]'>または</div>
        <div>ここにファイルをドラッグ＆ドロップ</div>
      </div>
    </div>
  );
}

export default function ImageDropzone({ conditionId }: { conditionId: string }) {
  const onDrop = useSetAtom(handleFileDropAtom(conditionId));
  const { getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
  });

  return (
    <div className='grid border-dashed border-2 transition-colors cursor-pointer hover:bg-accent hover:border-primary/30 rounded-lg p-4'>
      <div {...getRootProps()} className='grid grid-rows-[1fr_auto]'>
        <input {...getInputProps()} />
        <DropzoneContent />
      </div>
    </div>
  );
}
