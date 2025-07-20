import { createConfig } from '@/lib/plugin';
import { PluginConfigResetButton } from '@konomi-app/kintone-utilities-react';
import { useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import { FC, memo, useCallback } from 'react';
import { pluginConfigAtom } from '../../states/plugin';

const Component: FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const reset = useAtomCallback(
    useCallback((_, set) => {
      set(pluginConfigAtom, createConfig());
      enqueueSnackbar('設定をリセットしました', { variant: 'success' });
    }, [])
  );

  return <PluginConfigResetButton reset={reset} />;
};

export default memo(Component);
