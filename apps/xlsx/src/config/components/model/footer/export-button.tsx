import { loadingAtom, loadingEndAtom, loadingStartAtom } from '@/common/global-state';
import { PLUGIN_NAME } from '@/common/static';
import { t } from '@/lib/i18n';
import { PluginConfigExportButton } from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC, memo } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';

const handlePluginConfigExportAtom = atom(null, async (get, set) => {
  try {
    set(loadingStartAtom);
    const storage = await get(pluginConfigAtom);
    const blob = new Blob([JSON.stringify(storage, null)], {
      type: 'application/json',
    });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${PLUGIN_NAME}-config.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('common.config.toast.export'));
  } catch (error) {
    toast.error(t('common.config.error.export'));
    throw error;
  } finally {
    set(loadingEndAtom);
  }
});

const Component: FC = () => {
  const loading = useAtomValue(loadingAtom);
  const onClick = useSetAtom(handlePluginConfigExportAtom);

  return <PluginConfigExportButton loading={loading} onExportButtonClick={onClick} />;
};

export default memo(Component);
