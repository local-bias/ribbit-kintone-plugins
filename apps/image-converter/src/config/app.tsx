import { PluginErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { store } from '@/lib/store';
import {
  Notification,
  PluginBanner,
  PluginConfigProvider,
  PluginContent,
  PluginLayout,
} from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { URL_BANNER, URL_PROMOTION } from '@repo/constants/url';
import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import config from 'plugin.config.mjs';
import { FC, Suspense } from 'react';
import Debug from './components/model/debug';
import Footer from './components/model/footer';
import Form from './components/model/form';
import Sidebar from './components/model/sidebar';

const App: FC = () => (
  <Suspense fallback={<LoaderWithLabel label='画面の描画を待機しています' />}>
    <Provider store={store}>
      <ThemeProvider>
        <PluginErrorBoundary>
          <PluginConfigProvider config={config}>
            <Notification />
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
              <Debug />
            </SnackbarProvider>
          </PluginConfigProvider>
        </PluginErrorBoundary>
      </ThemeProvider>
    </Provider>
    <iframe title='promotion' loading='lazy' src={URL_PROMOTION} className='border-0 w-full h-16' />
  </Suspense>
);

export default App;
