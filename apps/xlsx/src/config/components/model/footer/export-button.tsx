import { loadingAtom } from '@/common/global-state';
import { t } from '@/lib/i18n';
import { PluginConfigExportButton } from '@konomi-app/kintone-utilities-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo } from 'react';
import { handlePluginConfigExportAtom } from '../../../states/plugin';

const Component: FC = () => {
  const loading = useAtomValue(loadingAtom);
  const onClick = useSetAtom(handlePluginConfigExportAtom);

  return <PluginConfigExportButton loading={loading} onExportButtonClick={onClick} />;
};

export default memo(Component);
