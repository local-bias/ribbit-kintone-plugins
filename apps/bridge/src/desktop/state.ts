import { getAppId } from '@konomi-app/kintone-utilities';
import { atom } from '@repo/jotai';

export const currentAppIdAtom = atom(getAppId()!);
