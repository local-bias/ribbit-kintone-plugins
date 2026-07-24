import { PluginErrorBoundary } from '@/lib/components/error-boundary';
import { t } from '@/lib/i18n-plugin';
import { URL_BANNER, URL_PROMOTION } from '@/lib/static';
import { store } from '@/lib/store';
import { PluginBanner, PluginContent, PluginLayout } from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { Provider } from 'jotai';
import { SnackbarProvider } from 'notistack';
import { Suspense } from 'react';
import Announcement from './components/announcement';
import Footer from './components/footer';
import Form from './components/form';
import Sidebar from './components/sidebar';
import { useInitialize } from './hooks/use-initialize';

function ConfigForm() {
  useInitialize();
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

export default function ConfigApp() {
  return (
    <Provider store={store}>
      <div className='🐸'>
        <Suspense fallback={<LoaderWithLabel label={t('config.loading.waitingForRender')} />}>
          <PluginErrorBoundary>
            <Announcement />
            <SnackbarProvider maxSnack={1} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <Suspense fallback={<LoaderWithLabel label={t('config.loading.fetchingSettings')} />}>
                <PluginLayout>
                  <ConfigForm />
                </PluginLayout>
              </Suspense>
            </SnackbarProvider>
          </PluginErrorBoundary>
          <iframe
            title='promotion'
            loading='lazy'
            src={URL_PROMOTION}
            className='border-0 w-full h-16'
          />
        </Suspense>
      </div>
    </Provider>
  );
}
