import { PluginConfigExportButton } from '@konomi-app/kintone-utilities-react';
import { loadingAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { type FC, memo } from 'react';
import { exportPluginConfigAtom } from '../../../states/plugin';

const Component: FC = () => {
  const exportConfig = useSetAtom(exportPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);

  return <PluginConfigExportButton loading={loading} onExportButtonClick={exportConfig} />;
};

export default memo(Component);
