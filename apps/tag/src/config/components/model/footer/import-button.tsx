import { PluginConfigImportButton } from '@konomi-app/kintone-utilities-react';
import { loadingAtom, useAtomValue, useSetAtom } from '@repo/jotai';
import { type FC, memo } from 'react';
import { importPluginConfigAtom } from '../../../states/plugin';

const Component: FC = () => {
  const importConfig = useSetAtom(importPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);

  return <PluginConfigImportButton onImportButtonClick={importConfig} loading={loading} />;
};

export default memo(Component);
