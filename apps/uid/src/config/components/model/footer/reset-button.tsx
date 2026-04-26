import { PluginConfigResetButton } from '@konomi-app/kintone-utilities-react';
import { useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import { type FC, memo, useCallback } from 'react';
import { t } from '@/lib/i18n';
import { createConfig } from '@/lib/plugin';
import { pluginConfigAtom } from '../../../states/plugin';

const Component: FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const reset = useAtomCallback(
    useCallback(
      (_, set) => {
        set(pluginConfigAtom, createConfig());
        enqueueSnackbar(t('config.toast.reset'), { variant: 'success' });
      },
      [enqueueSnackbar]
    )
  );

  return <PluginConfigResetButton reset={reset} />;
};

export default memo(Component);
