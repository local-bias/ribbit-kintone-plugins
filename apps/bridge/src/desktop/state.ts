import { getAppId } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';

export const currentAppIdAtom = atom(getAppId()!);
