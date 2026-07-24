import { allAppViewsAtom } from '@/config/states/kintone';
import { loadingAtom, loadingCountAtom, viewIdState } from '@/config/states/plugin';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { VIEW_ROOT_ID } from '@/lib/static';
import { getAppId, getViews, kintoneAPI, updateViews } from '@konomi-app/kintone-utilities';
import { Button } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { FC } from 'react';

const handleCreateNewViewAtom = atom(null, async (get, set) => {
  try {
    set(loadingCountAtom, (c) => c + 1);
    const allViews = get(allAppViewsAtom);

    const views = Object.entries(allViews);

    let viewName = t('config.form.calendarName');
    let counter = 1;
    while (views.some(([key]) => key === viewName)) {
      viewName = `${t('config.form.calendarName')} (${counter})`;
      counter++;
    }

    const newViews: Record<string, kintoneAPI.view.Parameter> = {
      ...allViews,
      [viewName]: {
        type: 'CUSTOM',
        device: 'ANY',
        pager: false,
        name: viewName,
        html: `<div id='${VIEW_ROOT_ID}' class="🐸"></div>`,
        index: views.length,
      },
    };

    await updateViews({
      app: getAppId()!,
      views: newViews,
      debug: process.env.NODE_ENV === 'development',
      guestSpaceId: GUEST_SPACE_ID,
    });

    const latestViews = await getViews({
      app: getAppId()!,
      preview: true,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });

    const viewId = latestViews.views[viewName].id;

    set(allAppViewsAtom, latestViews.views);
    set(viewIdState, viewId);
    enqueueSnackbar(t('config.toast.viewCreated'), { variant: 'success' });
  } catch (error) {
    process.env.NODE_ENV === 'development' && console.error(error);
    enqueueSnackbar(t('config.toast.viewCreationFailed'), { variant: 'error' });
  } finally {
    set(loadingCountAtom, (c) => c - 1);
  }
});

const Component: FC = () => {
  const loading = useAtomValue(loadingAtom);
  const onClick = useSetAtom(handleCreateNewViewAtom);

  return (
    <Button variant='outlined' color='primary' size='large' onClick={onClick} loading={loading}>
      {t('config.form.createNewView')}
    </Button>
  );
};

export default Component;
