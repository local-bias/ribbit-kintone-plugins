import { loadingAtom, loadingEndAtom, loadingStartAtom } from '@/common/global-state';
import { t } from '@/lib/i18n';
import styled from '@emotion/styled';
import { storePluginConfig } from '@konomi-app/kintone-utilities';
import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC, useCallback } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';
import ExportButton from './export-button';
import ImportButton from './import-button';
import ResetButton from './reset-button';

const handlePluginConfigSaveAtom = atom(null, (get, set) => {
  set(loadingStartAtom);
  try {
    const storage = get(pluginConfigAtom);

    storePluginConfig(storage!);
    toast.success(t('common.config.toast.save'), {
      description: t('common.config.toast.save.description'),
      action: {
        label: t('common.config.button.return'),
        onClick: () => history.back(),
      },
      duration: 6000,
    });
  } finally {
    set(loadingEndAtom);
  }
});

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
