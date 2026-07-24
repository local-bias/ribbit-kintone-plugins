import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { VIEW_ROOT_ID } from '@/lib/static';
import { getAppId, getViews, storeStorage, updateViews } from '@konomi-app/kintone-utilities';
import { PluginFooter } from '@konomi-app/kintone-utilities-react';
import SaveIcon from '@mui/icons-material/Save';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { Button, CircularProgress } from '@mui/material';
import { produce } from 'immer';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { FC, useCallback } from 'react';
import { loadingAtom, loadingCountAtom, pluginConfigAtom } from '../../states/plugin';
import ExportButton from './export-button';
import ImportButton from './import-button';
import ResetButton from './reset-button';

type Props = {
  onBackButtonClick: () => void;
};

const handleUpdatePluginConfigAtom = atom(null, async (get, set) => {
  set(loadingCountAtom, (c) => c + 1);
  try {
    const storage = get(pluginConfigAtom);

    const app = getAppId()!;
    const { views } = await getViews({
      app,
      preview: true,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });

    const newViews = produce(views, (draft) => {
      for (const condition of storage?.conditions || []) {
        for (const view of Object.values(draft)) {
          if (view.id === condition.viewId && view.type === 'CUSTOM') {
            view.html = `<div id='${VIEW_ROOT_ID}' class="🐸"></div>`;
            view.pager = false;
          }
        }
      }
    });

    await updateViews({
      app,
      views: newViews,
      guestSpaceId: GUEST_SPACE_ID,
    });

    storeStorage(storage!, () => true);
    enqueueSnackbar(t('config.toast.settingSaved'), {
      variant: 'success',
      action: (
        <Button color='inherit' onClick={() => history.back()}>
          {t('config.footer.backToPluginListShort')}
        </Button>
      ),
    });
  } finally {
    set(loadingCountAtom, (c) => c - 1);
  }
});

const Component: FC<Props> = ({ onBackButtonClick }) => {
  const loading = useAtomValue(loadingAtom);
  const onSaveButtonClick = useSetAtom(handleUpdatePluginConfigAtom);

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
          {t('config.footer.save')}
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
          {t('config.footer.backToPluginList')}
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
  const onBackButtonClick = useCallback(() => history.back(), []);

  return <Component {...{ onBackButtonClick }} />;
};

export default Container;
