import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useAsync } from '../use-async';
import { ErrorPlaceholder, LoadingPlaceholder } from '../placeholder';

async function renderMarkdown(blob: Blob): Promise<string> {
  const text = await blob.text();
  const html = await marked.parse(text, { gfm: true, breaks: true });
  return DOMPurify.sanitize(html);
}

export default function MarkdownPreview({ blob }: { blob: Blob }) {
  const state = useAsync(() => renderMarkdown(blob), [blob]);

  if (state.status === 'loading') {
    return <LoadingPlaceholder label='Markdownを読み込んでいます' />;
  }
  if (state.status === 'error') {
    return <ErrorPlaceholder />;
  }

  return (
    <div className='rad:p-6'>
      {/* サニタイズ済みのHTMLを描画します */}
      <div
        className='🐸markdown-body'
        // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurifyでサニタイズ済み
        dangerouslySetInnerHTML={{ __html: state.data }}
      />
    </div>
  );
}
