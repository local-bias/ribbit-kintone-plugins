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
    <div className='rad:space-y-1'>
      {condition.dropzoneDescription.split(/\r?\n/).map((line, index) => (
        <div key={index} className='rad:text-center'>
          {line}
        </div>
      ))}
    </div>
  );
}

function DropzoneIcon() {
  const loading = useAtomValue(loadingAtom);
  return loading ? (
    <Loader className='rad:text-4xl' />
  ) : (
    <Upload strokeWidth={1.5} className='rad:w-9 rad:h-9' />
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
          'rad:bg-background rad:overflow-hidden rad:border-dashed rad:border-2 rad:rounded-lg rad:transition-colors rad:cursor-pointer rad:hover:bg-accent rad:hover:border-primary/30 rad:flex rad:flex-col rad:items-center rad:justify-center rad:gap-4 rad:text-foreground/50 rad:text-xs rad:p-4',
          {
            'rad:border-primary/70 rad:bg-accent': isDragActive,
          }
        )}
      >
        <DropzoneIcon />
        <DropzoneDescription conditionId={conditionId} />
      </div>
    </div>
  );
}
