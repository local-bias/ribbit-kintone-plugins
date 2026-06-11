import { PluginConfigResetButton } from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import { useSetAtom } from '@repo/jotai';
import { type FC, memo } from 'react';
import { t } from '@/lib/i18n';
import { createConfig } from '@/lib/plugin';
import { pluginConfigAtom } from '../../../states/plugin';

const Component: FC = () => {
  const setStorage = useSetAtom(pluginConfigAtom);

  const reset = () => {
    setStorage(createConfig());
    toast.success(t('config.toast.reset'));
  };

  return <PluginConfigResetButton reset={reset} />;
};

export default memo(Component);
