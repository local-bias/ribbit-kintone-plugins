import { getInitialTagData } from '@/desktop/action';
import { atom } from 'jotai';

export const pluginConditionAtom = atom<Plugin.Condition | null>(null);

export const tagDataAtom = atom<Plugin.TagData>(getInitialTagData());
