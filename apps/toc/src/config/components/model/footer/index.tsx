import styled from '@emotion/styled';
import { storeStorage } from '@konomi-app/kintone-utilities';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useSnackbar } from 'notistack';
import { FC, FCX, useCallback } from 'react';
import { loadingAtom, storageAtom } from '../../../states/plugin';

import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import ExportButton from './export-button';
import ImportButton from './import-button';
import ResetButton from './reset-button';

type Props = {
  onSaveButtonClick: () => void;
  onBackButtonClick: () => void;
};

const Component: FCX<Props> = ({ className, onSaveButtonClick, onBackButtonClick }) => {
  const loading = useAtomValue(loadingAtom);

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

const Container: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const storage = useAtomValue(storageAtom);
  const [, setLoading] = useAtom(loadingAtom);

  const onBackButtonClick = useCallback(() => history.back(), []);

  const onSaveButtonClick = useCallback(async () => {
    setLoading(true);
    try {
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
      setLoading(false);
    }
  }, [storage, setLoading, enqueueSnackbar, onBackButtonClick]);

  return <StyledComponent {...{ onSaveButtonClick, onBackButtonClick }} />;
};

export default Container;
