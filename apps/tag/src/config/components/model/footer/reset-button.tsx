import { PluginConfigResetButton } from '@konomi-app/kintone-utilities-react';
import { useSetAtom } from 'jotai';
import { type FC, memo } from 'react';
import { handlePluginConfigResetAtom } from '../../../states/plugin';

const Component: FC = () => {
  const reset = useSetAtom(handlePluginConfigResetAtom);
  return <PluginConfigResetButton reset={reset} />;
};

export default memo(Component);
