import { usePluginStorage } from '@/config/hooks/use-plugin-storage';
import { t } from '@/lib/i18n';
import { storePluginConfig } from '@konomi-app/kintone-utilities';
import {
  PluginConfigExportButton,
  PluginConfigImportButton,
  PluginFooter,
} from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, useCallback } from 'react';
import { loadingState, pluginConfigAtom } from '../../../states/plugin';
import ResetButton from './reset-button';

type Props = {
  onSaveButtonClick: () => void;
  onBackButtonClick: () => void;
};

const Component: FC<Props> = ({ onSaveButtonClick, onBackButtonClick }) => {
  const loading = useAtomValue(loadingState);
  const { exportStorage, importStorage } = usePluginStorage();

  return (
    <PluginFooter className='py-2'>
      <div className='flex items-center gap-4'>
        <Button
          variant='contained'
          color='primary'
          disabled={loading}
          onClick={onSaveButtonClick}
          startIcon={loading ? <CircularProgress color='inherit' size={20} /> : <SaveIcon />}
        >
          {t('config.button.save')}
        </Button>
        <Button
          variant='contained'
          color='inherit'
          disabled={loading}
          onClick={onBackButtonClick}
          startIcon={
            loading ? <CircularProgress color='inherit' size={20} /> : <SettingsBackupRestoreIcon />
          }
        >
          {t('config.button.return')}
        </Button>
      </div>
      <div className='flex items-center gap-4'>
        <PluginConfigExportButton loading={loading} onExportButtonClick={exportStorage} />
        <PluginConfigImportButton onImportButtonClick={importStorage} loading={loading} />
        <ResetButton />
      </div>
    </PluginFooter>
  );
};

const Container: FC = () => {
  const storage = useAtomValue(pluginConfigAtom);
  const setLoading = useSetAtom(loadingState);

  const onBackButtonClick = useCallback(() => history.back(), []);

  const onSaveButtonClick = useCallback(async () => {
    setLoading(true);
    try {
      storePluginConfig(storage);
      toast.success('設定を保存しました', {
        description: 'アプリ設定に戻り、「アプリを更新」ボタンを押すと、設定が反映されます。',
        action: {
          label: 'プラグイン一覧へ戻る',
          onClick: () => history.back(),
        },
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  }, [storage, setLoading, onBackButtonClick]);

  return <Component {...{ onSaveButtonClick, onBackButtonClick }} />;
};

export default Container;
