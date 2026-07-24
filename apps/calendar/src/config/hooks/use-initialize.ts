import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { getAppId, getViews } from '@konomi-app/kintone-utilities';
import { atom, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { useEffect } from 'react';
import { allAppViewsAtom } from '../states/kintone';
import { loadingCountAtom } from '../states/plugin';

export const initializeAppViewsAtom = atom(null, async (_, set) => {
  try {
    set(loadingCountAtom, (c) => c + 1);
    const app = getAppId();
    if (!app) {
      throw new Error(t('config.error.fieldInfoNotFound'));
    }

    const { views } = await getViews({
      app,
      preview: true,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });

    set(allAppViewsAtom, views);
  } catch (error) {
    enqueueSnackbar(t('config.error.viewInfoNotFound'), { variant: 'error' });
  } finally {
    set(loadingCountAtom, (c) => c - 1);
  }
});

export const useInitialize = () => {
  const initialize = useSetAtom(initializeAppViewsAtom);

  useEffect(() => {
    initialize();
  }, []);

  return {};
};
