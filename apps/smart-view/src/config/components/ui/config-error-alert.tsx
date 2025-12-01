import { createConfig } from '@/lib/plugin';
import { t } from '@/lib/i18n';
import { storeStorage } from '@konomi-app/kintone-utilities';
import { Alert, AlertTitle, Button, Stack } from '@mui/material';
import { useAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { FC } from 'react';
import { configErrorAtom, pluginConfigAtom } from '../../states/plugin';

/**
 * プラグイン設定の読み込み時に発生したエラーを表示するコンポーネント
 * リセットボタンで設定をデフォルトに戻すことができる
 */
export const ConfigErrorAlert: FC = () => {
  const [error, setError] = useAtom(configErrorAtom);
  const [, setPluginConfig] = useAtom(pluginConfigAtom);

  if (!error) {
    return null;
  }

  const handleReset = () => {
    try {
      const defaultConfig = createConfig();
      setPluginConfig(defaultConfig);
      setError(null);
      enqueueSnackbar(t('config.error.migration.resetSuccess'), { variant: 'success' });
    } catch (resetError) {
      console.error('設定のリセットに失敗しました', resetError);
      enqueueSnackbar(t('config.error.migration.resetFailed'), { variant: 'error' });
    }
  };

  return (
    <Alert severity='error' sx={{ mb: 2 }}>
      <AlertTitle>{t('config.error.migration.title')}</AlertTitle>
      <Stack spacing={2}>
        <div>
          <p>{t('config.error.migration.description')}</p>
          <details style={{ marginTop: '8px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              {t('config.error.migration.errorDetails')}
            </summary>
            <pre
              style={{
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
                fontSize: '12px',
              }}
            >
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        </div>
        <div>
          <p style={{ marginBottom: '8px' }}>{t('config.error.migration.recoverySteps')}</p>
          <ol style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li>{t('config.error.migration.step1')}</li>
            <li>{t('config.error.migration.step2')}</li>
            <li>{t('config.error.migration.step3')}</li>
          </ol>
          <Button variant='contained' color='error' onClick={handleReset}>
            {t('config.error.migration.resetButton')}
          </Button>
        </div>
      </Stack>
    </Alert>
  );
};
