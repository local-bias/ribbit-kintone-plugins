import { useObjectUrl } from '../../use-object-url';
import { LoadingPlaceholder } from '../placeholder';

export default function PdfPreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const url = useObjectUrl(blob);
  if (!url) {
    return <LoadingPlaceholder label='PDFを読み込んでいます' />;
  }
  return <iframe src={url} title={fileName} className='rad:border-0 rad:w-full rad:h-[85svh]' />;
}
