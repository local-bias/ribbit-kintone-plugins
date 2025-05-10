import { formatSupportListAtom } from '@/lib/global-states';
import { cn } from '@repo/utils';
import { useAtomValue } from 'jotai';

export default function FormatSupportList() {
  const supportList = useAtomValue(formatSupportListAtom);
  return (
    <div className='flex'>
      <div className='grid grid-cols-[auto_100px] gap-2 text-xs'>
        {supportList.map((item, index) => (
          <div key={index} className='contents'>
            <div>{item.format}: </div>
            <div
              key={index}
              className={cn('border rounded-full px-3 py-1 justify-self-center', {
                'text-green-700 border-green-200 bg-green-50': item.supported,
                'text-red-700 border-red-200 bg-red-50': !item.supported,
              })}
            >
              {item.supported ? 'サポート' : '非サポート'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
