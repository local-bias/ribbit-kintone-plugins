import { useObjectUrl } from '../../use-object-url';
import { LoadingPlaceholder } from '../placeholder';

export default function VideoPreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const url = useObjectUrl(blob);
  if (!url) {
    return <LoadingPlaceholder label='動画を読み込んでいます' />;
  }
  return (
    <div className='rad:w-full rad:min-h-[60svh] rad:grid rad:place-items-center rad:p-4 rad:bg-black'>
      {/* biome-ignore lint/a11y/useMediaCaption: ユーザーがアップロードした動画にキャプションは存在しません */}
      <video src={url} controls className='rad:max-w-full rad:max-h-[80svh]'>
        {fileName}
      </video>
    </div>
  );
}
