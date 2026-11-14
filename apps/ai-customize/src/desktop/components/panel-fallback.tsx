import { Alert, Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSetAtom } from '@repo/jotai';
import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { t } from '@/lib/i18n';
import { reloadPanelAtom } from '../states/launcher';

const Center = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: 24,
});

export function PanelLoading() {
  return (
    <Center role='status'>
      <CircularProgress size={20} />
      <span>{t('desktop.panel.loading')}</span>
    </Center>
  );
}

/** 一覧を取得できなかったときに、案内と再試行を出します */
export function PanelErrorBoundary(props: { children: ReactNode }) {
  const reload = useSetAtom(reloadPanelAtom);
  return (
    <ErrorBoundary
      onReset={() => reload()}
      // 例外の中身は利用者の画面に出さず、コンソールにだけ出す(docs/05-runtime.md 3章)
      onError={(error) => console.error('[ai-customize]', error)}
      fallbackRender={({ resetErrorBoundary }) => (
        <Alert
          severity='error'
          sx={{ m: 2 }}
          action={
            <Button color='inherit' size='small' onClick={resetErrorBoundary}>
              {t('desktop.panel.retry')}
            </Button>
          }
        >
          {t('desktop.panel.loadFailed')}
        </Alert>
      )}
    >
      {props.children}
    </ErrorBoundary>
  );
}
