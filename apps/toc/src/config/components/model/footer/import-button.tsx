import { PluginConfigImportButton } from '@konomi-app/kintone-utilities-react';
import { useSetAtom } from 'jotai';
import { useSnackbar } from 'notistack';
import { ChangeEventHandler, FC, memo, useCallback } from 'react';
import { storageAtom } from '../../../states/plugin';

const onFileLoad = (file: File | Blob, encoding = 'UTF-8') => {
  return new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.readAsText(file, encoding);

      reader.onload = (event) => resolve(event);
      reader.onerror = (event) => reject(event);
    } catch (error) {
      reject(error);
    }
  });
};

const Component: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const setStorage = useSetAtom(storageAtom);

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      try {
        const { files } = event.target;
        if (!files?.length) {
          return;
        }
        const [file] = Array.from(files);
        const fileEvent = await onFileLoad(file);
        const text = (fileEvent.target?.result ?? '') as string;
        setStorage(JSON.parse(text));
        enqueueSnackbar('設定情報をインポートしました', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(
          '設定情報のインポートに失敗しました、ファイルに誤りがないか確認してください',
          { variant: 'error' }
        );
        throw error;
      }
    },
    [setStorage, enqueueSnackbar]
  );

  return <PluginConfigImportButton onImportButtonClick={onChange} loading={false} />;
};

export default memo(Component);
