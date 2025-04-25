import {
  currentKintoneEventTypeAtom,
  handleQueuedFileAddAtom,
  pluginConditionAtom,
} from '@/desktop/states';
import {
  getCurrentRecord,
  kintoneAPI,
  setCurrentRecord,
  updateRecord,
  uploadFile,
} from '@konomi-app/kintone-utilities';
import { currentAppIdAtom, loadingEndAtom, loadingStartAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { enqueueSnackbar } from 'notistack';
import { GUEST_SPACE_ID, isProd } from './global';
import { convertImageFormat, isFormatSupported } from './image';

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
      if (!isProd) {
        console.groupCollapsed('handleFileDropAtom');
        console.log('🖼️ files', files);
      }
      const condition = get(pluginConditionAtom(conditionId));

      const converted = await Promise.all(
        files.map(async (file) => ({
          name: file.name.replace(/\.[^/.]+$/, `.${condition.imageFormat}`),
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

      if (['create', 'edit'].some((type) => currentEventType?.includes(type))) {
        set(handleQueuedFileAddAtom(condition.targetFileFieldCode), ...uploaded);

        setCurrentRecord({ record });
      } else {
        const app = get(currentAppIdAtom);

        await updateRecord({
          app,
          guestSpaceId: GUEST_SPACE_ID,
          id: record.$id?.value as string,
          record: {
            [condition.targetFileFieldCode]: {
              value: [
                ...(record[condition.targetFileFieldCode] as kintoneAPI.field.File).value,
                ...uploaded,
              ],
            },
          },
        });
        enqueueSnackbar('変換したファイルをアップロードしました', { variant: 'success' });
      }

      set(filesAtom(conditionId), files);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`ファイルのアップロードに失敗しました: ${error}`, { variant: 'error' });
    } finally {
      set(loadingEndAtom);
      if (!isProd) {
        console.groupEnd();
      }
    }
  })
);
