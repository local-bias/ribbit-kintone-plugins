import { renderAsync } from 'docx-preview';
import { useEffect, useRef, useState } from 'react';
import { ErrorPlaceholder, LoadingPlaceholder } from '../placeholder';

type Status = 'loading' | 'success' | 'error';

export default function DocumentPreview({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;
    const container = containerRef.current;
    if (!container) return;

    setStatus('loading');
    container.innerHTML = '';

    renderAsync(blob, container, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
    })
      .then(() => {
        if (active) setStatus('success');
      })
      .catch((error) => {
        console.error('docx render error', error);
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [blob]);

  return (
    <div className='rad:relative rad:w-full rad:min-h-[60svh] rad:bg-foreground/5'>
      {status === 'loading' && <LoadingPlaceholder label='文書を解析しています' />}
      {status === 'error' && <ErrorPlaceholder message='文書の解析に失敗しました。' />}
      <div
        ref={containerRef}
        className={status === 'success' ? '🐸docx-body rad:p-4' : 'rad:hidden'}
      />
    </div>
  );
}
