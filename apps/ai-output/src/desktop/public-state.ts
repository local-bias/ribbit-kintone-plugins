import { atom } from 'jotai';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';

export const pluginConfigAtom = atom(restorePluginConfig());
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);
