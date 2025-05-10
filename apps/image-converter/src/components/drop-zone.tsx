import { pluginConditionAtom } from '@/desktop/states';
import { handleFileDropAtom } from '@/lib/global-states';
import { cn } from '@repo/utils';
import { Loader } from '@konomi-app/ui-react';
import { loadingAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

function DropzoneDescription({ conditionId }: { conditionId: string }) {
  const condition = useAtomValue(pluginConditionAtom(conditionId));

  return (
    <div className='space-y-1'>
      {condition.dropzoneDescription.split(/\r?\n/).map((line, index) => (
        <div key={index} className='text-center'>
          {line}
        </div>
      ))}
    </div>
  );
}

function DropzoneIcon() {
  const loading = useAtomValue(loadingAtom);
  return loading ? (
    <Loader className='text-4xl' />
  ) : (
    <Upload strokeWidth={1.5} className='w-9 h-9' />
  );
}

export default function ImageDropzone({ conditionId }: { conditionId: string }) {
  const onDrop = useSetAtom(handleFileDropAtom(conditionId));
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
  });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <div
        className={cn(
          'border-dashed border-2 rounded-lg transition-colors cursor-pointer hover:bg-accent hover:border-primary/30 flex flex-col items-center justify-center gap-4 text-foreground/50 text-xs p-4',
          {
            'border-primary/70 bg-accent': isDragActive,
          }
        )}
      >
        <DropzoneIcon />
        <DropzoneDescription conditionId={conditionId} />
      </div>
    </div>
  );
}
