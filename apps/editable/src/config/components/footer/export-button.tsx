import { PluginConfigExportButton } from '@konomi-app/kintone-utilities-react';
import { loadingAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';
import { exportPluginConfigAtom } from '../../states/plugin';

const Component: FC = () => {
  const onClick = useSetAtom(exportPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);
  return <PluginConfigExportButton loading={loading} onExportButtonClick={onClick} />;
};

export default Component;
