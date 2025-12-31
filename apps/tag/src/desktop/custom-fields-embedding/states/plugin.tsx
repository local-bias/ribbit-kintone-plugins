import { getInitialTagData } from '@/desktop/action';
import { TAG_CACHE_STORAGE_KEY } from '@/lib/static';
import { getYuruChara } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';

export const pluginConditionAtom = atom<Plugin.Condition | null>(null);

export const tagDataAtom = atom<Plugin.TagData>(getInitialTagData());

/** タグサジェスト用の全タグリスト */
export const allTagsAtom = atom<string[]>([]);

/** 入力中のテキスト */
export const inputValueAtom = atom<string>('');

/** サジェストのカーソル位置 */
export const suggestionCursorAtom = atom<number>(-1);

/** ローカルストレージに保存されたキャッシュ */
export const tagCacheAtom = atom<Record<string, string[]>>(() => {
  const item = localStorage.getItem(TAG_CACHE_STORAGE_KEY) || '{}';
  return JSON.parse(item);
});

/** キャッシュIDを生成するatom（アプリID + フィールドコードから生成） */
export const cacheIdAtom = atom<string>((get) => {
  const condition = get(pluginConditionAtom);
  if (!condition) {
    return '';
  }
  const appId = kintone.app.getId();
  return `${appId}-${condition.targetField}`;
});

/** キャッシュからタグを取得 */
export const cachedTagsAtom = atom<string[]>((get) => {
  const cacheId = get(cacheIdAtom);
  if (!cacheId) {
    return [];
  }
  const cache = get(tagCacheAtom);
  return cache[cacheId] || [];
});

/** フィルタリングされたサジェストオプション */
export const filteredSuggestionsAtom = atom((get) => {
  const inputValue = get(inputValueAtom);
  const allTags = get(allTagsAtom);
  const currentTags = get(tagDataAtom).tags.map((t) => t.value);

  // 現在選択済みのタグは除外
  const availableTags = allTags.filter((tag) => !currentTags.includes(tag));

  if (!inputValue) {
    // 入力がない場合は上位50件を表示
    return availableTags.slice(0, 50);
  }

  // ゆるキャラ変換で検索
  const searchValue = getYuruChara(inputValue);
  const words = searchValue.split(/\s+/g);

  const filtered = availableTags.filter((tag) => {
    const tagYuruChara = getYuruChara(tag);
    return words.every((word) => tagYuruChara.includes(word));
  });

  return filtered.slice(0, 50);
});
