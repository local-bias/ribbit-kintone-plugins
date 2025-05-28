import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';
import { downloadFile, kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { entries } from 'remeda';

export const pluginConfigAtom = atom(restorePluginConfig());
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);

export const currentAppFormFieldsAtom = atom((get) => {
  return get(appFormFieldsAtom({ app: get(currentAppIdAtom), guestSpaceId: GUEST_SPACE_ID }));
});

export const targetRecordAtom = atom<kintoneAPI.RecordData | null>(null);

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

// PDFファイルを1つ以上持つフィールド
export const fileFieldsWithPDFAtom = atom((get) => {
  const fields = get(fileFieldsAtom);
  const filter = (file: kintoneAPI.field.File['value'][number]) =>
    file.contentType === 'application/pdf';
  return fields
    .filter((field) => field.value.some(filter))
    .map((field) => ({ code: field.code, type: field.type, value: field.value.filter(filter) }));
});

export const previewFileKeyAtom = atom<string | null>(null);

const fileAtom = atomFamily((fileKey: string) =>
  atom(async () => {
    return downloadFile({ fileKey, guestSpaceId: GUEST_SPACE_ID, debug: isDev });
  })
);

export const previewFileAtom = atom(async (get) => {
  const fileKey = get(previewFileKeyAtom);
  if (!fileKey) {
    return null;
  }
  return get(fileAtom(fileKey));
});

export const showDrawerAtom = atom(false);
export const handleDrawerOpenAtom = atom(null, (_, set) => {
  set(showDrawerAtom, true);
});
export const handleDrawerCloseAtom = atom(null, (_, set) => {
  set(showDrawerAtom, false);
});
