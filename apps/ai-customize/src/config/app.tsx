import {
  Notification,
  PluginBanner,
  PluginConfigProvider,
  PluginContent,
  PluginLayout,
} from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { URL_BANNER, URL_PROMOTION } from '@repo/constants';
import { Provider, store } from '@repo/jotai';
import { PluginThemeProvider } from '@repo/plugin/react';
import { SnackbarProvider } from 'notistack';
import { Suspense } from 'react';
import config from '@/../plugin.config.mjs';
import { t } from '@/lib/i18n';
import AiSection from './components/ai-section';
import AssetAppSection from './components/asset-app-section';
import ChoiceValuesSection from './components/choice-values-section';
import { PluginErrorBoundary } from './components/error-boundary';
import FieldMappingSection from './components/field-mapping-section';
import Footer from './components/footer';

/**
 * 設定画面
 *
 * 本プラグインに「条件」の概念は無いため、サイドバーを出さず共通設定だけを表示する(ADR-8)
 */
export default function App() {
  return (
    <Suspense fallback={<LoaderWithLabel label={t('common.config.rootIsLoading')} />}>
      <Provider store={store}>
        <PluginThemeProvider>
          <PluginErrorBoundary>
            <PluginConfigProvider config={config}>
              <Notification />
              <SnackbarProvider maxSnack={1}>
                <Suspense fallback={<LoaderWithLabel label={t('common.config.formIsLoading')} />}>
                  <PluginLayout>
                    <PluginContent>
                      <PluginErrorBoundary>
                        <div className='p-4'>
                          <AssetAppSection />
                          <FieldMappingSection />
                          <ChoiceValuesSection />
                          <AiSection />
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
        </PluginThemeProvider>
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
