import { t } from '@/lib/i18n';
import styled from '@emotion/styled';
import {
  PluginConfigExportButton,
  PluginConfigImportButton,
  PluginFooter,
} from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button } from '@mui/material';
import { loadingAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, FCX, useCallback } from 'react';
import {
  exportPluginConfigAtom,
  handlePluginConfigUpdateAtom,
  importPluginConfigAtom,
} from '../../states/plugin';
import ResetButton from './reset-button';

type Props = {
  onSaveButtonClick: () => void;
  onBackButtonClick: () => void;
};

const ImportButton: FC = () => {
  const onClick = useSetAtom(importPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);
  return <PluginConfigImportButton onImportButtonClick={onClick} loading={loading} />;
};

const ExportButton: FC = () => {
  const onClick = useSetAtom(exportPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);
  return <PluginConfigExportButton loading={loading} onExportButtonClick={onClick} />;
};

const Component: FCX<Props> = ({ className, onSaveButtonClick, onBackButtonClick }) => {
  const loading = useAtomValue(loadingAtom);

  return (
    <PluginFooter {...{ className }}>
      <div>
        <Button
          variant='contained'
          color='primary'
          loading={loading}
          onClick={onSaveButtonClick}
          startIcon={<SaveIcon />}
        >
          {t('common.config.button.save')}
        </Button>
        <Button
          variant='contained'
          color='inherit'
          loading={loading}
          onClick={onBackButtonClick}
          startIcon={<SettingsBackupRestoreIcon />}
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
