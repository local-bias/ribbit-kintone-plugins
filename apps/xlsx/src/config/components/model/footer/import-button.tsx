import { PluginConfigImportButton } from '@konomi-app/kintone-utilities-react';
import { useSetAtom } from 'jotai';
import { type FC, memo } from 'react';
import { handlePluginConfigImportAtom } from '../../../states/plugin';

const Component: FC = () => {
  const onChange = useSetAtom(handlePluginConfigImportAtom);
  return <PluginConfigImportButton onImportButtonClick={onChange} loading={false} />;
};

export default memo(Component);
