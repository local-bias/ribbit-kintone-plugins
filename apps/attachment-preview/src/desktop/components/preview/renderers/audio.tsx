import { Music } from 'lucide-react';
import { useObjectUrl } from '../../use-object-url';
import { LoadingPlaceholder } from '../placeholder';

export default function AudioPreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const url = useObjectUrl(blob);
  if (!url) {
    return <LoadingPlaceholder label='音声を読み込んでいます' />;
  }
  return (
    <div className='rad:w-full rad:min-h-[60svh] rad:grid rad:place-items-center rad:p-8'>
      <div className='rad:flex rad:flex-col rad:items-center rad:gap-6 rad:w-full rad:max-w-xl'>
        <Music className='rad:w-20 rad:h-20 rad:text-foreground/30' />
        <div className='rad:text-sm rad:text-foreground/60 rad:truncate rad:max-w-full'>
          {fileName}
        </div>
        {/* biome-ignore lint/a11y/useMediaCaption: ユーザーがアップロードした音声にキャプションは存在しません */}
        <audio src={url} controls className='rad:w-full'>
          {fileName}
        </audio>
      </div>
    </div>
  );
}
