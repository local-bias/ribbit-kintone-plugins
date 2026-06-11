import {
  Notification,
  PluginBanner,
  PluginConfigProvider,
  PluginContent,
  PluginLayout,
} from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { Provider } from '@repo/jotai';
import { Suspense } from 'react';
import config from '@/../plugin.config.mjs';
import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { ThemeProvider } from '@/lib/components/theme-provider';
import { URL_BANNER, URL_PROMOTION } from '@/lib/static';
import Footer from './components/model/footer';
import Form from './components/model/form';
import Sidebar from './components/sidebar';

function PluginConfigContent() {
  return (
    <>
      <Sidebar />
      <PluginContent>
        <PluginErrorBoundary>
          <Form />
        </PluginErrorBoundary>
      </PluginContent>
      <PluginBanner url={URL_BANNER} />
      <Footer />
    </>
  );
}

export default function PluginConfigApp() {
  return (
    <Suspense fallback={<LoaderWithLabel label='画面の描画を待機しています' />}>
      <ThemeProvider>
        <Provider>
          <PluginErrorBoundary>
            <PluginConfigProvider config={config}>
              <Notification />
              <Suspense fallback={<LoaderWithLabel label='設定情報を取得しています' />}>
                <PluginLayout>
                  <PluginConfigContent />
                </PluginLayout>
              </Suspense>
            </PluginConfigProvider>
          </PluginErrorBoundary>
        </Provider>
      </ThemeProvider>
      <iframe
        title='promotion'
        loading='lazy'
        src={URL_PROMOTION}
        className='border-0 w-full h-16'
      />
    </Suspense>
  );
}
