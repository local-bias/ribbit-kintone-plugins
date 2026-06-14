import { atom } from '@repo/jotai';
import { RESET } from '@repo/jotai/utils';
import {
  previewContentTypeAtom,
  previewFileKeyAtom,
  previewFileNameAtom,
  showDrawerAtom,
} from '../public-state';

export type OpenPreviewParams = {
  key: string;
  name: string;
  contentType?: string;
};

export const handleDrawerOpenAtom = atom(null, (_, set, params: OpenPreviewParams) => {
  set(previewFileKeyAtom, params.key);
  set(previewFileNameAtom, params.name);
  set(previewContentTypeAtom, params.contentType ?? null);
  set(showDrawerAtom, true);
});

export const handleDrawerCloseAtom = atom(null, (_, set) => {
  set(showDrawerAtom, false);
  set(previewFileKeyAtom, RESET);
  set(previewFileNameAtom, RESET);
  set(previewContentTypeAtom, RESET);
});
