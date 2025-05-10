import { PluginErrorBoundary } from '@/components/error-boundary';
import { SwimmingIcon } from '@/components/icon-swimming';
import { ThemeProvider } from '@/components/theme-provider';
import { LANGUAGE } from '@/lib/global';
import {
  Notification,
  PluginBanner,
  PluginConfigProvider,
  PluginContent,
  PluginLayout,
} from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { URL_BANNER, URL_PROMOTION } from '@repo/constants';
import { store } from '@repo/jotai';
import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import config from 'plugin.config.mjs';
import { Suspense } from 'react';
import Footer from './components/model/footer';

export default function App() {
  return (
    <Suspense fallback={<LoaderWithLabel label='画面の描画を待機しています' />}>
      <Provider store={store}>
        <ThemeProvider>
          <PluginErrorBoundary>
            <PluginConfigProvider config={config}>
              <Notification />
              <SnackbarProvider maxSnack={1}>
                <Suspense fallback={<LoaderWithLabel label='設定情報を取得しています' />}>
                  <PluginLayout singleCondition>
                    {/* <Sidebar /> */}
                    <PluginContent>
                      <PluginErrorBoundary>
                        {/* <Form /> */}
                        <div className='grid place-items-center gap-8 py-12'>
                          <div className='text-2xl font-bold'>このプラグインは設定不要です。</div>
                          <SwimmingIcon className='w-48 h-48' />
                          <div className='text-2xl font-bold '>
                            {/* @ts-expect-error - manifestの言語にLANGUAGEが含まれない可能性がある */}
                            {config.manifest.base.name[LANGUAGE] ?? config.manifest.base.name.ja}
                          </div>
                          <div className='text-sm'>
                            {/* @ts-expect-error - manifestの言語にLANGUAGEが含まれない可能性がある */}
                            {config.manifest.base.description[LANGUAGE] ??
                              config.manifest.base.description.ja}
                          </div>
                        </div>
                      </PluginErrorBoundary>
                    </PluginContent>
                    <PluginBanner url={URL_BANNER} />
                    <Footer />
                  </PluginLayout>
                </Suspense>
              </SnackbarProvider>
            </PluginConfigProvider>
          </PluginErrorBoundary>
        </ThemeProvider>
      </Provider>
      <iframe
        title='promotion'
        loading='lazy'
        src={URL_PROMOTION}
        className='border-0 w-full h-16'
      />
    </Suspense>
  );
}
