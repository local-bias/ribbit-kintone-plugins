import { atom } from 'jotai';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';

const { config } = restorePluginConfig();

export const pluginConfigAtom = atom(config);
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);
