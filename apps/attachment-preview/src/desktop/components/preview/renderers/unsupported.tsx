import { FileQuestion } from 'lucide-react';
import { getExtension } from '@/lib/preview';

export default function UnsupportedPreview({ fileName }: { fileName: string }) {
  const extension = getExtension(fileName);
  return (
    <div className='rad:w-full rad:h-[60svh] rad:grid rad:place-items-center rad:text-foreground/70'>
      <div className='rad:flex rad:flex-col rad:items-center rad:gap-6 rad:p-4 rad:text-center'>
        <FileQuestion className='rad:w-16 rad:h-16 rad:text-foreground/40' />
        <div>
          <div className='rad:font-medium'>このファイル形式はプレビューに対応していません。</div>
          {extension && (
            <div className='rad:text-xs rad:text-foreground/50 rad:mt-1'>
              拡張子: .{extension}
            </div>
          )}
        </div>
        <div className='rad:text-sm rad:text-foreground/60'>
          下部のボタンからダウンロードしてご確認ください。
        </div>
      </div>
    </div>
  );
}
