import { PluginConfigImportButton } from '@konomi-app/kintone-utilities-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';
import { importPluginConfigAtom } from '../../states/plugin';
import { loadingAtom } from '@repo/jotai';

const Component: FC = () => {
  const onClick = useSetAtom(importPluginConfigAtom);
  const loading = useAtomValue(loadingAtom);
  return <PluginConfigImportButton onImportButtonClick={onClick} loading={loading} />;
};

export default Component;
