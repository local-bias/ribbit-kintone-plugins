import { PluginConfigExportButton } from '@konomi-app/kintone-utilities-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo } from 'react';
import { exportPluginConfigAtom, } from '../../../states/plugin';
import { loadingAtom } from '@repo/jotai';

const Component: FC = () => {
  const exportConfig = useSetAtom(exportPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);

  return <PluginConfigExportButton loading={loading} onExportButtonClick={exportConfig} />;
};

export default memo(Component);
