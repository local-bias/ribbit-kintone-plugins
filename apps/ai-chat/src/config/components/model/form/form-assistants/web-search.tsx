import { allowWebSearchAtom, defaultWebSearchEnabledAtom } from '@/config/states/plugin';
import { JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import { PluginFormDescription, PluginFormTitle } from '@konomi-app/kintone-utilities-react';
import { Skeleton } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Suspense } from 'react';

function WebSearchSwitchContent() {
  const allowWebSearch = useAtomValue(allowWebSearchAtom);

  return (
    <div>
      <PluginFormTitle>ウェブ検索</PluginFormTitle>
      <PluginFormDescription>
        有効にすると、チャット入力欄の上部にユーザーが切り替えられるウェブ検索トグルが表示されます。
      </PluginFormDescription>
      <PluginFormDescription last>
        ユーザーはチャット画面で必要に応じてウェブ検索をオン/オフできます。
      </PluginFormDescription>
      <div className='rad:flex rad:flex-col rad:gap-4'>
        <div>
          <JotaiSwitch atom={allowWebSearchAtom} label='ウェブ検索を許可する' />
        </div>
        {allowWebSearch && (
          <div>
            <JotaiSwitch
              atom={defaultWebSearchEnabledAtom}
              label='初期値としてウェブ検索を有効にする'
            />
          </div>
        )}
      </div>
    </div>
  );
}

function WebSearchSwitchFallback() {
  return (
    <div>
      <PluginFormTitle>ウェブ検索</PluginFormTitle>
      <Skeleton variant='rounded' height={32} width={200} />
    </div>
  );
}

export default function WebSearchSwitch() {
  return (
    <Suspense fallback={<WebSearchSwitchFallback />}>
      <WebSearchSwitchContent />
    </Suspense>
  );
}
