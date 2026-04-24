import { usePluginStorage, useSavePluginConfig } from '@/config/hooks/use-plugin-storage';
import { t } from '@/lib/i18n';
import {
  PluginConfigExportButton,
  PluginConfigImportButton,
  PluginFooter,
} from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { useAtomValue } from 'jotai';
import { FC, useCallback } from 'react';
import { loadingAtom } from '../../../states/plugin';
import ResetButton from './reset-button';
import styled from '@emotion/styled';

type Props = {
  backToPluginList: () => void;
};

const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SaveButton: FC<Pick<Props, 'backToPluginList'>> = ({ backToPluginList }) => {
  const loading = useAtomValue(loadingAtom);
  const savePluginConfig = useSavePluginConfig(
    <Button color='inherit' size='small' variant='outlined' onClick={backToPluginList}>
      {t('config.button.return')}
    </Button>
  );

  return (
    <Button
      variant='contained'
      color='primary'
      disabled={loading}
      onClick={savePluginConfig}
      startIcon={loading ? <CircularProgress color='inherit' size={20} /> : <SaveIcon />}
    >
      {t('config.button.save')}
    </Button>
  );
};

const Component: FC<Props> = ({ backToPluginList }) => {
  const loading = useAtomValue(loadingAtom);
  const { exportStorage, importStorage } = usePluginStorage();

  return (
    <>
      <ButtonRow>
        <SaveButton backToPluginList={backToPluginList} />
        <Button
          variant='contained'
          color='inherit'
          disabled={loading}
          onClick={backToPluginList}
          startIcon={
            loading ? <CircularProgress color='inherit' size={20} /> : <SettingsBackupRestoreIcon />
          }
        >
          {t('config.button.return')}
        </Button>
      </ButtonRow>
      <ButtonRow>
        <PluginConfigExportButton loading={loading} onExportButtonClick={exportStorage} />
        <PluginConfigImportButton onImportButtonClick={importStorage} loading={loading} />
        <ResetButton />
      </ButtonRow>
    </>
  );
};

const Footer: FC = () => {
  const backToPluginList = useCallback(() => history.back(), []);

  return (
    <PluginFooter style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <Component {...{ backToPluginList }} />
    </PluginFooter>
  );
};

export default Footer;
