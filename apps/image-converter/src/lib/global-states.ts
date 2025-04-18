import { atom } from 'jotai';
import { derive } from 'jotai-derive';
import { atomFamily } from 'jotai/utils';
import { enqueueSnackbar } from 'notistack';
import { convertImageFormat, isFormatSupported } from './image';
import { ImageFormat } from '@/schema/image';
import { loadingEndAtom, loadingStartAtom } from '@repo/jotai/index';
import {
  getCurrentRecord,
  kintoneAPI,
  setCurrentRecord,
  uploadFile,
} from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID, isProd } from './global';
import { currentKintoneEventTypeAtom, pluginConditionAtom } from '@/desktop/states';

const isFormatSupportedAtom = atomFamily((format: 'webp' | 'avif' | 'jpeg' | 'png') => {
  return atom(() => {
    return isFormatSupported(format);
  });
});

export const formatSupportListAtom = atom((get) => {
  return [
    { format: 'webp', supported: get(isFormatSupportedAtom('webp')) },
    { format: 'avif', supported: get(isFormatSupportedAtom('avif')) },
    { format: 'jpeg', supported: get(isFormatSupportedAtom('jpeg')) },
    { format: 'png', supported: get(isFormatSupportedAtom('png')) },
  ];
});

export const filesAtom = atomFamily((_conditionId: string) => atom<File[]>([]));

export const handleFileDropAtom = atomFamily((conditionId: string) =>
  atom(null, async (get, set, files: File[]) => {
    try {
      set(loadingStartAtom);
      const condition = get(pluginConditionAtom(conditionId));

      const converted = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await convertImageFormat(file, condition.imageFormat, 0.8),
        }))
      );

      const uploaded = await Promise.all(
        converted.map(async (file) => {
          const blob = new Blob([file.data], { type: file.data.type });
          const { fileKey } = await uploadFile({
            file: {
              name: file.name,
              data: blob,
            },
            guestSpaceId: GUEST_SPACE_ID,
            debug: !isProd,
          });
          return {
            fileKey,
            name: file.name,
            contentType: file.data.type,
            size: file.data.size.toString(),
          };
        })
      );

      if (!uploaded.length) {
        enqueueSnackbar('ファイルが見つかりませんでした', { variant: 'error' });
        return;
      }

      const currentEventType = get(currentKintoneEventTypeAtom);

      if (!condition.targetFileFieldCode) {
        enqueueSnackbar(
          'ファイルフィールドが指定されていません。プラグインの設定を確認してください。',
          { variant: 'error' }
        );
        return;
      }

      if (['create', 'edit'].some((type) => currentEventType?.includes(type))) {
        const { record } = getCurrentRecord();

        if (
          !record[condition.targetFileFieldCode] ||
          record[condition.targetFileFieldCode]?.type !== 'FILE'
        ) {
          enqueueSnackbar(
            '保存先のファイルフィールドが存在しません。プラグインの設定を確認してください。',
            { variant: 'error' }
          );
          return;
        }

        (record[condition.targetFileFieldCode] as kintoneAPI.field.File).value.push(...uploaded);

        setCurrentRecord({ record });
      } else {
      }

      set(filesAtom(conditionId), files);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`ファイルのアップロードに失敗しました: ${error}`, { variant: 'error' });
    } finally {
      set(loadingEndAtom);
    }
  })
);
