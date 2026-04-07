import { t } from '@/lib/i18n';
import { PluginConfigImportButton } from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import { atom, useSetAtom } from 'jotai';
import { ChangeEvent, FC, memo } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';

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

const handlePluginConfigImportAtom = atom(
  null,
  async (_, set, event: ChangeEvent<HTMLInputElement>) => {
    try {
      const { files } = event.target;
      if (!files?.length) {
        return;
      }
      const [file] = Array.from(files);
      const fileEvent = await onFileLoad(file);
      const text = (fileEvent.target?.result ?? '') as string;
      set(pluginConfigAtom, JSON.parse(text));
      toast.success(t('common.config.toast.import'));
    } catch (error) {
      toast.error(t('common.config.error.import'));
      throw error;
    }
  }
);

const Component: FC = () => {
  const onChange = useSetAtom(handlePluginConfigImportAtom);
  return <PluginConfigImportButton onImportButtonClick={onChange} loading={false} />;
};

export default memo(Component);
