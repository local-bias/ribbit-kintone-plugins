import { getAppId, getViews, type kintoneAPI, updateViews } from '@konomi-app/kintone-utilities';
import { Button } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import { type FC, useCallback } from 'react';
import invariant from 'tiny-invariant';
import { allAppViewsAtom } from '@/config/states/kintone';
import { loadingAtom, loadingCountAtom, viewIdAtom } from '@/config/states/plugin';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import { VIEW_ROOT_ID } from '@/lib/statics';

const ViewCreateButton: FC = () => {
  const loading = useAtomValue(loadingAtom);
  const { enqueueSnackbar } = useSnackbar();

  const onClick = useAtomCallback(
    useCallback(async (get, set) => {
      try {
        set(loadingCountAtom, (c) => c + 1);
        const allViews = await get(allAppViewsAtom);

        const views = Object.entries(allViews);

        let viewName = '🔎 高速検索';
        let counter = 1;
        while (views.some(([key]) => key === viewName)) {
          viewName = `🔎 高速検索 (${counter})`;
          counter++;
        }

        const newViews: Record<string, kintoneAPI.view.Parameter> = {
          ...allViews,
          [viewName]: {
            type: 'CUSTOM',
            device: 'ANY',
            pager: false,
            name: viewName,
            html: `<div id='${VIEW_ROOT_ID}'></div>`,
            index: views.length,
          },
        };

        const app = getAppId();
        invariant(app, 'アプリIDが取得できませんでした');
        const guestSpaceId = GUEST_SPACE_ID;
        await updateViews({ app, views: newViews, debug: isDev, guestSpaceId });
        const latestViews = await getViews({ app, preview: true, guestSpaceId, debug: isDev });

        const viewId = latestViews.views[viewName].id;

        set(allAppViewsAtom, latestViews.views);
        set(viewIdAtom, viewId);
        enqueueSnackbar(t('config.app.toast.createView'), { variant: 'success' });
      } catch (error) {
        isDev && console.error(error);
        enqueueSnackbar(t('config.app.toast.createViewFailed'), { variant: 'error' });
      } finally {
        set(loadingCountAtom, (c) => c - 1);
      }
    }, [])
  );

  return (
    <Button variant='outlined' color='primary' size='large' onClick={onClick} loading={loading}>
      {t('config.app.form.createViewButton.label')}
    </Button>
  );
};

export default ViewCreateButton;
