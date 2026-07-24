import { createConfig } from '@/lib/plugin';
import { t } from '@/lib/i18n-plugin';
import { PluginConfigResetButton } from '@konomi-app/kintone-utilities-react';
import { atom, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { FC, memo } from 'react';
import { pluginConfigAtom } from '../../states/plugin';

const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  enqueueSnackbar(t('config.toast.settingReset'), { variant: 'success' });
});

const Component: FC = () => {
  const reset = useSetAtom(handlePluginConfigResetAtom);
  return <PluginConfigResetButton reset={reset} />;
};

export default memo(Component);
