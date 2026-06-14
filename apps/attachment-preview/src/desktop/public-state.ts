import { downloadFile, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, atom, currentAppIdAtom } from '@repo/jotai';
import { atomFamily, atomWithReset } from '@repo/jotai/utils';
import { entries } from 'remeda';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { getPreviewKind, type PreviewKind } from '@/lib/preview';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';

export const pluginConfigAtom = atom(restorePluginConfig());
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);

export const currentAppFormFieldsAtom = atom((get) => {
  return get(appFormFieldsAtom({ app: get(currentAppIdAtom), guestSpaceId: GUEST_SPACE_ID }));
});

export const targetRecordAtom = atom<kintoneAPI.RecordData | null>(null);

/** レコード内のすべての添付ファイルフィールド */
export const fileFieldsAtom = atom<(kintoneAPI.field.File & { code: string })[]>((get) => {
  const record = get(targetRecordAtom);
  if (!record) {
    return [];
  }

  const fileFields = entries(record).filter(([, field]) => field.type === 'FILE') as [
    key: string,
    value: kintoneAPI.field.File,
  ][];

  return fileFields.map(([code, { type, value }]) => ({ code, type, value }));
});

/** 現在プレビュー対象のファイル情報 */
export const previewFileKeyAtom = atomWithReset<string | null>(null);
export const previewFileNameAtom = atomWithReset<string | null>(null);
export const previewContentTypeAtom = atomWithReset<string | null>(null);

/** 現在プレビュー対象のファイルのプレビュー種別 */
export const previewKindAtom = atom<PreviewKind | null>((get) => {
  const fileName = get(previewFileNameAtom);
  if (!fileName) return null;
  const contentType = get(previewContentTypeAtom) ?? undefined;
  return getPreviewKind(fileName, contentType);
});

const fileBlobAtom = atomFamily((fileKey: string) =>
  atom(async () => {
    const blob = await downloadFile({ fileKey, guestSpaceId: GUEST_SPACE_ID, debug: isDev });
    isDev && console.log('📄 file downloaded', { fileKey, blob });
    return blob;
  })
);

/** プレビュー対象ファイルのBlob（ダウンロード結果） */
export const previewBlobAtom = atom(async (get) => {
  const fileKey = get(previewFileKeyAtom);
  if (!fileKey) {
    return null;
  }
  return get(fileBlobAtom(fileKey));
});

export const showDrawerAtom = atom(false);
