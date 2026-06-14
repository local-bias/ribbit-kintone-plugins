import { LoaderWithLabel } from '@konomi-app/ui-react';
import { FileX2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingPlaceholder({ label = 'ファイルを読み込んでいます' }: { label?: string }) {
  return (
    <div className='rad:w-full rad:h-[60svh] rad:grid rad:place-items-center'>
      <LoaderWithLabel label={label} />
    </div>
  );
}

export function MessagePlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className='rad:w-full rad:h-[60svh] rad:grid rad:place-items-center rad:text-foreground/70'>
      <div className='rad:p-4 rad:grid rad:place-items-center rad:gap-8'>
        <div className='rad:text-center'>{children}</div>
        <FileX2 className='rad:w-16 rad:h-16 rad:text-foreground/40' />
      </div>
    </div>
  );
}

export function ErrorPlaceholder({
  message = 'ファイルの読み込みに失敗しました。',
}: {
  message?: string;
}) {
  return <MessagePlaceholder>{message}</MessagePlaceholder>;
}
