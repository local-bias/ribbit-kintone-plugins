import { storeStorage } from '@konomi-app/kintone-utilities';
import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import React, { FC, useCallback } from 'react';
import { loadingAtom, pluginConfigAtom } from '../../states/plugin';
import ExportButton from './export-button';
import ImportButton from './import-button';
import ResetButton from './reset-button';

type Props = {
  onSaveButtonClick: () => void;
  onBackButtonClick: () => void;
};

const Component: FC<Props> = ({ onSaveButtonClick, onBackButtonClick }) => {
  const loading = useAtomValue(loadingAtom);

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
          設定を保存
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
          プラグイン一覧へ戻る
        </Button>
      </div>
      <div className='flex items-center gap-4'>
        <ExportButton />
        <ImportButton />
        <ResetButton />
      </div>
    </PluginFooter>
  );
};

const Container: FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const onBackButtonClick = useCallback(() => history.back(), []);

  const onSaveButtonClick = useAtomCallback(
    useCallback(async (get, set) => {
      set(loadingAtom, true);
      try {
        const storage = get(pluginConfigAtom);

        storeStorage(storage, () => true);
        enqueueSnackbar('設定を保存しました', {
          variant: 'success',
          action: (
            <Button color='inherit' size='small' variant='outlined' onClick={onBackButtonClick}>
              プラグイン一覧に戻る
            </Button>
          ),
        });
      } finally {
        set(loadingAtom, false);
      }
    }, [])
  );

  return <Component {...{ onSaveButtonClick, onBackButtonClick }} />;
};

export default Container;
