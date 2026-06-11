import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from '@repo/jotai';

export const kintoneEventAtom = atom<kintoneAPI.js.EventType | null>(null);
