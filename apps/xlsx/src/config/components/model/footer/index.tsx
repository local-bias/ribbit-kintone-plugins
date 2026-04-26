import styled from '@emotion/styled';
import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { type FC, useCallback } from 'react';
import { loadingAtom } from '@/common/global-state';
import { t } from '@/lib/i18n';
import { handlePluginConfigSaveAtom } from '../../../states/plugin';
import ExportButton from './export-button';
import ImportButton from './import-button';
import ResetButton from './reset-button';

const Component: FC<{ className?: string }> = ({ className }) => {
  const loading = useAtomValue(loadingAtom);
  const onBackButtonClick = useCallback(() => history.back(), []);
  const onSaveButtonClick = useSetAtom(handlePluginConfigSaveAtom);

  return (
    <PluginFooter {...{ className }}>
      <div>
        <Button
          variant='contained'
          color='primary'
          disabled={loading}
          onClick={onSaveButtonClick}
          startIcon={loading ? <CircularProgress color='inherit' size={20} /> : <SaveIcon />}
        >
          {t('common.config.button.save')}
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
          {t('common.config.button.return')}
        </Button>
      </div>
      <div>
        <ExportButton />
        <ImportButton />
        <ResetButton />
      </div>
    </PluginFooter>
  );
};

const StyledComponent = styled(Component)`
  button {
    margin: 8px;
  }
`;

export default StyledComponent;
