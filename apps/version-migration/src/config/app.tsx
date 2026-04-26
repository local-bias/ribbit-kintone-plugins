import { css } from '@emotion/css';
import { PluginBanner, PluginContent, PluginLayout } from '@konomi-app/kintone-utilities-react';
import { LoaderWithLabel } from '@konomi-app/ui-react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { URL_BANNER, URL_PROMOTION } from '@repo/constants';
import { store } from '@repo/jotai';
import { Provider } from 'jotai';
import { Suspense } from 'react';
import config from '@/../plugin.config.mjs';
import { PluginErrorBoundary } from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';

export default function App() {
  return (
    <Suspense fallback={<LoaderWithLabel label='画面の描画を待機しています' />}>
      <Provider store={store}>
        <ThemeProvider>
          <PluginLayout singleCondition>
            {/* <Sidebar /> */}
            <PluginContent>
              <PluginErrorBoundary>
                <div
                  className={css`
                    padding: 16px;
                    max-width: 600px;
                    min-height: 800px;
                    margin: 0 auto;
                    display: grid;
                    place-items: center;
                  `}
                >
                  <Alert variant='outlined' severity='warning'>
                    <AlertTitle>プラグインのバージョンが古くなっています。</AlertTitle>
                    プラグイン公開ページより最新バージョンをダウンロードして、更新してください。
                    <div
                      className={css`
                        margin-top: 16px;
                      `}
                    >
                      <Button
                        variant='contained'
                        color='warning'
                        href={
                          config.pluginReleasePageUrl ?? 'https://ribbit.konomi.app/kintone-plugin/'
                        }
                        target='_blank'
                      >
                        プラグイン公開ページへ
                      </Button>
                    </div>
                  </Alert>
                </div>
              </PluginErrorBoundary>
            </PluginContent>
            <PluginBanner url={URL_BANNER} />
          </PluginLayout>
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
