import { t } from '@/lib/i18n';
import styled from '@emotion/styled';
import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { loadingAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, FCX, useCallback } from 'react';
import { handlePluginConfigUpdateAtom } from '../../states/plugin';
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

const Container: FC = () => {
  const onBackButtonClick = useCallback(() => history.back(), []);
  const onSaveButtonClick = useSetAtom(handlePluginConfigUpdateAtom);

  return (
    <StyledComponent
      {...{
        onSaveButtonClick: () =>
          onSaveButtonClick(
            <Button color='inherit' size='small' variant='outlined' onClick={onBackButtonClick}>
              プラグイン一覧に戻る
            </Button>
          ),
        onBackButtonClick,
      }}
    />
  );
};

export default Container;
