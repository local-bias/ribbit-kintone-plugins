import { PluginErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { t } from '@/lib/i18n';
import {
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
import { FC, Suspense } from 'react';
import Footer from './components/footer';
import Form from './components/form';
import Sidebar from './components/sidebar';

const Component: FC = () => (
  <Suspense fallback={<LoaderWithLabel label={t('common.config.rootIsLoading')} />}>
    <Provider store={store}>
      <ThemeProvider>
        <PluginErrorBoundary>
          <PluginConfigProvider config={config}>
            <SnackbarProvider maxSnack={1}>
              <Suspense fallback={<LoaderWithLabel label={t('common.config.formIsLoading')} />}>
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
          </PluginConfigProvider>
        </PluginErrorBoundary>
      </ThemeProvider>
    </Provider>
    <iframe
      title='promotion'
      loading='lazy'
      src={URL_PROMOTION}
      style={{ border: '0', width: '100%', height: '64px' }}
    />
  </Suspense>
);

export default Component;
