import { Provider, store } from '@repo/jotai';
import { Suspense } from 'react';
import { PluginErrorBoundary } from '@/components/error-boundary';
import TabList from './tab-list';

export default function App() {
  return (
    <Provider store={store}>
      <PluginErrorBoundary>
        {/*
         * タブの表示条件の評価には、閲覧者の所属情報の取得(非同期)を伴う場合があります。
         * 解決するまでは何も描画せず、レコード画面のレイアウトを乱さないようにします。
         */}
        <Suspense fallback={null}>
          <TabList />
        </Suspense>
      </PluginErrorBoundary>
    </Provider>
  );
}
