import { useAsync } from '../use-async';
import { ErrorPlaceholder, LoadingPlaceholder, MessagePlaceholder } from '../placeholder';

/** これを超えるテキストはプレビューせず、ダウンロードを促します */
const MAX_TEXT_PREVIEW_BYTES = 2 * 1024 * 1024;

export default function TextPreview({ blob }: { blob: Blob; fileName?: string }) {
  const state = useAsync(() => blob.text(), [blob]);

  if (blob.size > MAX_TEXT_PREVIEW_BYTES) {
    return (
      <MessagePlaceholder>
        ファイルサイズが大きいため、プレビューを省略しました。
        <br />
        ダウンロードしてご確認ください。
      </MessagePlaceholder>
    );
  }

  if (state.status === 'loading') {
    return <LoadingPlaceholder label='テキストを読み込んでいます' />;
  }
  if (state.status === 'error') {
    return <ErrorPlaceholder />;
  }

  return (
    <div className='rad:p-4'>
      <pre className='rad:w-full rad:text-xs! rad:font-mono! rad:p-4 rad:bg-foreground/5 rad:rounded rad:whitespace-pre-wrap rad:break-words'>
        {state.data}
      </pre>
    </div>
  );
}
