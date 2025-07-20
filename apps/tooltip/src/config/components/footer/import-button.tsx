import { migrateConfig } from '@/lib/plugin';
import { onFileLoad } from '@konomi-app/kintone-utilities';
import { PluginConfigImportButton } from '@konomi-app/kintone-utilities-react';
import { useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import { ChangeEventHandler, FC, memo, useCallback } from 'react';
import { pluginConfigAtom } from '../../states/plugin';

const Component: FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const onChange: ChangeEventHandler<HTMLInputElement> = useAtomCallback(
    useCallback(async (_, set, event) => {
      try {
        const { files } = event.target;
        if (!files?.length) {
          return;
        }
        const [file] = Array.from(files);
        const fileEvent = await onFileLoad(file);
        const text = (fileEvent.target?.result ?? '') as string;
        set(pluginConfigAtom, migrateConfig(JSON.parse(text)));
        enqueueSnackbar('設定情報をインポートしました', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(
          '設定情報のインポートに失敗しました、ファイルに誤りがないか確認してください',
          { variant: 'error' }
        );
        throw error;
      }
    }, [])
  );

  return <PluginConfigImportButton onImportButtonClick={onChange} loading={false} />;
};

export default memo(Component);
