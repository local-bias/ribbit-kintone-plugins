import { ThemeProvider } from '@mui/material';
import { Provider, store } from '@repo/jotai';
import { SnackbarProvider } from 'notistack';
import { ErrorBoundary } from 'react-error-boundary';
import { Launcher } from '../components/launcher';
import { launcherTheme } from './theme';

/**
 * ランチャーのルート
 *
 * ランチャーの不具合でkintoneの画面を壊さないよう、失敗したら何も描画しない(アセットの実行は続く)
 */
export function LauncherApp() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={launcherTheme}>
        {/* 起動ボタン(右下)と重ならないよう、左下に出す */}
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
          <ErrorBoundary
            fallback={null}
            onError={(error) => console.error('[ai-customize]', error)}
          >
            <Launcher />
          </ErrorBoundary>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
}
