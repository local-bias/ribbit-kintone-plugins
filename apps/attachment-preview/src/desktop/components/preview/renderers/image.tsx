import { useObjectUrl } from '../../use-object-url';
import { LoadingPlaceholder } from '../placeholder';

export default function ImagePreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const url = useObjectUrl(blob);
  if (!url) {
    return <LoadingPlaceholder label='画像を読み込んでいます' />;
  }
  return (
    <div className='rad:w-full rad:min-h-[60svh] rad:grid rad:place-items-center rad:p-4 rad:bg-foreground/5'>
      <img
        src={url}
        alt={fileName}
        className='rad:max-w-full rad:max-h-[80svh] rad:object-contain'
      />
    </div>
  );
}
