import DOMPurify from 'dompurify';
import { useAsync } from '../use-async';
import { ErrorPlaceholder, LoadingPlaceholder } from '../placeholder';

async function sanitizeHtml(blob: Blob): Promise<string> {
  const text = await blob.text();
  // 完全なHTMLドキュメントとして許可しつつ、スクリプト等の危険な要素を除去します
  return DOMPurify.sanitize(text, { WHOLE_DOCUMENT: true });
}

export default function HtmlPreview({ blob, fileName }: { blob: Blob; fileName: string }) {
  const state = useAsync(() => sanitizeHtml(blob), [blob]);

  if (state.status === 'loading') {
    return <LoadingPlaceholder label='HTMLを読み込んでいます' />;
  }
  if (state.status === 'error') {
    return <ErrorPlaceholder />;
  }

  return (
    <iframe
      title={fileName}
      srcDoc={state.data}
      // スクリプト等を無効化した隔離環境でレンダリングします
      sandbox=''
      className='rad:border-0 rad:w-full rad:h-[85svh] rad:bg-white'
    />
  );
}
