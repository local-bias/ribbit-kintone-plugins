import { GUEST_SPACE_ID } from '@/lib/global';
import { restorePluginConfig } from '@/lib/plugin';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { derive } from 'jotai-derive';
import { atomFamily } from 'jotai/utils';
import { enqueueSnackbar } from 'notistack';

export const pluginConfigAtom = atom(restorePluginConfig());

export const pluginConditionAtom = atomFamily((conditionId: string) =>
  atom((get) => {
    const config = get(pluginConfigAtom);
    const condition = config.conditions.find((condition) => condition.id === conditionId);
    if (!condition) {
      throw new Error(`Condition with ID ${conditionId} not found`);
    }
    return condition;
  })
);

export const currentAppFormFieldsAtom = atom((get) => {
  return get(appFormFieldsAtom({ appId: get(currentAppIdAtom), spaceId: GUEST_SPACE_ID }));
});

export const currentAppFileFieldsAtom = derive(
  [currentAppFormFieldsAtom],
  (currentAppFormFields) => {
    return currentAppFormFields.filter(
      (field) => field.type === 'FILE'
    ) as kintoneAPI.property.File[];
  }
);

export const currentKintoneEventTypeAtom = atom<kintoneAPI.js.EventType | null>(null);

/**
 * レコード編集時に対象レコードへファイルをアップロードしてしまうと、編集中のレコードを保存することができなくなるため、
 * レコード編集時は一時的に編集情報を保持し、レコード保存が実行された後に、対象ファイルをアップロードします。
 *
 * このatomは、レコード編集時にアップロードしたファイルを保持するためのatomです。
 */
export const queuedFilesAtom = atom<Record<string, kintoneAPI.field.File['value']>>({});

export const handleQueuedFileAddAtom = atomFamily((fieldCode: string) =>
  atom(null, (_, set, ...files: kintoneAPI.field.File['value']) => {
    set(queuedFilesAtom, (prev) => ({
      ...prev,
      [fieldCode]: [...(prev[fieldCode] ?? []), ...files],
    }));
    enqueueSnackbar('ファイルをアップロードしました。ファイルはレコード保存後に反映されます。', {
      variant: 'info',
    });
  })
);
