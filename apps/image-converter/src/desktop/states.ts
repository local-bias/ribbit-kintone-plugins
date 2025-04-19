import { restorePluginConfig } from '@/lib/plugin';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

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

export const currentKintoneEventTypeAtom = atom<kintoneAPI.js.EventType | null>(null);
