import { getSpaceElement } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { store } from '@/lib/store';
import { pluginConfigAtom } from './state';

/** 現在アクティブな（表示中の）spaceId */
export const activeSpaceIdAtom = atom<string | null>(null);

/** IntersectionObserverのインスタンス */
let headingObserver: IntersectionObserver | null = null;

/**
 * 見出し要素の監視を開始
 * スクロール位置に応じて現在表示中の見出しを追跡する
 */
export function startHeadingObserver() {
  // 既存のオブザーバーをクリーンアップ
  stopHeadingObserver();

  const { conditions } = store.get(pluginConfigAtom);
  if (!conditions.length) {
    return;
  }

  // kintoneヘッダーを考慮したrootMargin
  // 上部140pxはヘッダー領域として除外
  const rootMargin = '-140px 0px -60% 0px';

  headingObserver = new IntersectionObserver(
    (entries) => {
      // 画面内に入った要素のうち、最も上にあるものを選択
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);

      if (visibleEntries.length === 0) {
        return;
      }

      // 最も画面上部に近い要素を取得
      const topEntry = visibleEntries.reduce((prev, current) => {
        return prev.boundingClientRect.top < current.boundingClientRect.top ? prev : current;
      });

      const spaceId = (topEntry.target as HTMLElement).dataset.ribbitTocSpaceId;
      if (spaceId) {
        store.set(activeSpaceIdAtom, spaceId);
      }
    },
    {
      rootMargin,
      threshold: 0,
    }
  );

  // 各条件のスペース要素を監視対象に追加
  for (const condition of conditions) {
    const spaceElement = getSpaceElement(condition.spaceId);
    if (spaceElement) {
      // data属性でspaceIdを紐付け
      spaceElement.dataset.ribbitTocSpaceId = condition.spaceId;
      headingObserver.observe(spaceElement);
    }
  }
}

/**
 * 見出し要素の監視を停止
 */
export function stopHeadingObserver() {
  if (headingObserver) {
    headingObserver.disconnect();
    headingObserver = null;
  }
  store.set(activeSpaceIdAtom, null);
}
