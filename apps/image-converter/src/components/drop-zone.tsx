import { handleFileDropAtom } from '@/lib/global-states';
import { useSetAtom } from 'jotai';
import { Image } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function ImageDropzone() {
  const onDrop = useSetAtom(handleFileDropAtom);
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    maxFiles: 1,
    onDrop,
  });

  return (
    <div className='grid border-dashed border-2 transition-colors cursor-pointer hover:bg-accent rounded-lg p-4'>
      <div {...getRootProps()} className='grid grid-rows-[1fr_auto]'>
        <input {...getInputProps()} />
        <div className='py-12 flex flex-col items-center justify-center gap-4 text-foreground/50'>
          <Image strokeWidth={1} className='w-12 h-12' />
          <p></p>
        </div>
        <ul>
          {acceptedFiles.map((file, index) => index < 5 && <li key={file.path}>{file.path}</li>)}
          {acceptedFiles.length > 5 && <li>...and {acceptedFiles.length - 5} files</li>}
        </ul>
      </div>
    </div>
  );
}
