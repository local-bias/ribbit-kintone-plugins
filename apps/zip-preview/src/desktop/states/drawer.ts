import { atom } from 'jotai';
import {
  previewZipFileKeyAtom,
  previewZipFileNameAtom,
  selectedFileContentKeyAtom,
} from '../public-state';
import { RESET } from 'jotai/utils';

export const showDrawerAtom = atom(false);

export const handleDrawerOpenAtom = atom(null, (_, set, params: { key: string; name: string }) => {
  set(previewZipFileKeyAtom, params.key);
  set(previewZipFileNameAtom, params.name);
  set(showDrawerAtom, true);
});

export const handleDrawerCloseAtom = atom(null, (_, set) => {
  set(showDrawerAtom, false);
  set(previewZipFileKeyAtom, RESET);
  set(previewZipFileNameAtom, RESET);
  set(selectedFileContentKeyAtom, RESET);
});
