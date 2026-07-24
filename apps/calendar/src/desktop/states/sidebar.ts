import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const sidebarExpandedAtom = atomWithStorage<boolean>(
  `${LOCAL_STORAGE_KEY}.sidebarExpanded`,
  true
);
export const toggleSidebarExpandedAtom = atom(null, (_, set) => {
  set(sidebarExpandedAtom, (current) => !current);
});

export const displayingCategoriesAtom = atom<string[] | null>(null);
