import { PluginBanner, PluginContent, PluginLayout } from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import { Suspense } from 'react';
import { URL_BANNER, URL_PROMOTION } from '@/common/static';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { store } from '@/lib/store';
import Footer from './components/model/footer';
import Form from './components/model/form';
import Sidebar from './components/model/sidebar';

export default function App() {
  return (
    <Provider store={store}>
      <Suspense fallback={<LoaderWithLabel label='画面の描画を待機しています' />}>
        <PluginErrorBoundary>
          <SnackbarProvider maxSnack={1}>
            <Suspense fallback={<LoaderWithLabel label='設定情報を取得しています' />}>
              <PluginLayout>
                <Sidebar />
                <PluginContent>
                  <PluginErrorBoundary>
                    <Form />
                  </PluginErrorBoundary>
                </PluginContent>
                <PluginBanner url={URL_BANNER} />
                <Footer />
              </PluginLayout>
            </Suspense>
          </SnackbarProvider>
        </PluginErrorBoundary>
      </Suspense>
      <iframe
        title='promotion'
        loading='lazy'
        src={URL_PROMOTION}
        style={{ border: '0', width: '100%', height: '64px' }}
      />
    </Provider>
  );
}
