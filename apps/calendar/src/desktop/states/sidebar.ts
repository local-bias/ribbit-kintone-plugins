import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { calendarEventCategoryAtom } from './kintone';

export const sidebarExpandedAtom = atomWithStorage<boolean>(
  `${LOCAL_STORAGE_KEY}.sidebarExpanded`,
  true
);
export const toggleSidebarExpandedAtom = atom(null, (_, set) => {
  set(sidebarExpandedAtom, (current) => !current);
});

export const displayingCategoriesAtom = atom<string[] | null>(null);

/** カテゴリーの表示・非表示を切り替えます(サイドバーと凡例で共用) */
export const toggleDisplayingCategoryAtom = atom(null, async (get, set, category: string) => {
  const categories = (await get(calendarEventCategoryAtom)) ?? [];
  set(displayingCategoriesAtom, (current) => {
    const newArray = current === null ? categories : [...current];

    if (newArray.includes(category)) {
      return newArray.filter((item) => item !== category);
    }
    return [...newArray, category];
  });
});
