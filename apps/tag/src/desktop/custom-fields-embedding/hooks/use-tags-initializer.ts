import { GUEST_SPACE_ID } from '@/lib/global';
import { TAG_CACHE_STORAGE_KEY } from '@/lib/static';
import { getAllRecords, getAppId } from '@konomi-app/kintone-utilities';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { allTagsAtom, cacheIdAtom, cachedTagsAtom, pluginConditionAtom } from '../states/plugin';

/**
 * 既存タグを非同期で取得しキャッシュするフック
 *
 * 処理の流れ:
 * 1. キャッシュが存在する場合は先にキャッシュを表示
 * 2. バックグラウンドで最新のタグ一覧を取得
 * 3. 取得完了後にatom更新＋ローカルストレージにキャッシュ保存
 *
 * @param enabled サジェスト機能が有効かどうか。無効の場合は何もしない
 */
export function useTagsInitializer(enabled: boolean): void {
  const condition = useAtomValue(pluginConditionAtom);
  const [allTags, setAllTags] = useAtom(allTagsAtom);
  const cachedTags = useAtomValue(cachedTagsAtom);
  const cacheId = useAtomValue(cacheIdAtom);

  useEffect(() => {
    // サジェスト機能が無効の場合は何もしない
    if (!enabled) {
      process.env.NODE_ENV === 'development' &&
        console.info('[tag] サジェスト機能が無効のため、タグ取得をスキップします');
      return;
    }

    if (!condition) {
      process.env.NODE_ENV === 'development' && console.warn('[tag] condition is not set');
      return;
    }

    // キャッシュが存在する場合は先に表示
    if (cachedTags.length > 0 && allTags.length === 0) {
      process.env.NODE_ENV === 'development' &&
        console.info('[tag] キャッシュが存在するため、キャッシュを利用します', cachedTags);
      setAllTags(cachedTags);
    }

    // 非同期で最新のタグ一覧を取得
    (async () => {
      const app = getAppId();
      if (!app) {
        process.env.NODE_ENV === 'development' && console.warn('[tag] appId is not found');
        return;
      }

      const { targetField } = condition;
      const allRecords = await getAllRecords({
        app,
        fields: [targetField],
        guestSpaceId: GUEST_SPACE_ID,
        debug: process.env.NODE_ENV === 'development',
        onStep: ({ records }) => {
          // キャッシュがある場合は段階的更新をスキップ
          if (cachedTags.length > 0) {
            return;
          }
          const tags = extractTagsFromRecords(records, targetField);
          setAllTags(tags);
        },
      });

      const tags = extractTagsFromRecords(allRecords, targetField);

      process.env.NODE_ENV === 'development' &&
        console.log('[tag] 最新のタグを取得しました', { count: tags.length, tags });

      setAllTags(tags);

      // ローカルストレージにキャッシュ保存
      const localStorageItem = localStorage.getItem(TAG_CACHE_STORAGE_KEY) || '{}';
      const cache = {
        ...JSON.parse(localStorageItem),
        version: 1,
        [cacheId]: tags,
      };
      localStorage.setItem(TAG_CACHE_STORAGE_KEY, JSON.stringify(cache));

      process.env.NODE_ENV === 'development' && console.info('[tag] キャッシュを更新しました');
    })();
  }, [enabled, condition, cacheId]);
}

/**
 * レコード配列からタグを抽出し、重複を除去してソート
 */
function extractTagsFromRecords(
  records: Array<Record<string, { value: unknown }>>,
  fieldCode: string
): string[] {
  const tagsSet = new Set<string>();

  for (const record of records) {
    const value = record[fieldCode]?.value;
    if (typeof value !== 'string' || !value) {
      continue;
    }
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    for (const tag of tags) {
      tagsSet.add(tag);
    }
  }

  // アルファベット順でソート
  return Array.from(tagsSet).sort((a, b) => a.localeCompare(b, 'ja'));
}
