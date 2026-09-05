import { useAtomValue, useSetAtom } from '@repo/jotai';
import { clsx } from 'clsx';
import { type KeyboardEvent, useRef } from 'react';
import { t } from '@/lib/i18n';
import {
  conditionIdsWithMissingRequiredAtom,
  selectedTabIndexAtom,
  tabWidthAtom,
  visiblePluginConditionsAtom,
} from '../public-state';
import { handleTabChangeAtom } from '../states/tab';

/** WAI-ARIAのタブパターンに沿ったキー操作(縦方向) */
const resolveNextIndex = (key: string, current: number, length: number): number | null => {
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % length;
    case 'ArrowUp':
      return (current - 1 + length) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
};

/**
 * レコード画面の左側に固定表示される、垂直方向のタブです
 *
 * スタイルは`src/styles/desktop.css`にレイヤー外(unlayered)で定義しています。
 * kintone標準のCSSに打ち消されないための措置で、詳細はそちらのコメントを参照してください。
 * このコンポーネントではTailwindのユーティリティクラスを使用しません。
 *
 * 幅だけは共通設定から与えられるため、インラインスタイルで指定しています
 * (インラインスタイルはkintone側のCSSに影響されません)。
 */
export default function TabList() {
  const conditions = useAtomValue(visiblePluginConditionsAtom);
  const selectedIndex = useAtomValue(selectedTabIndexAtom);
  const tabWidth = useAtomValue(tabWidthAtom);
  const missingRequiredIds = useAtomValue(conditionIdsWithMissingRequiredAtom);
  const onTabChange = useSetAtom(handleTabChangeAtom);
  const listRef = useRef<HTMLDivElement>(null);

  if (conditions.length === 0) {
    return null;
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const nextIndex = resolveNextIndex(event.key, selectedIndex, conditions.length);
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    onTabChange(nextIndex);
    listRef.current?.querySelectorAll<HTMLButtonElement>('.ribbit-tab__item')[nextIndex]?.focus();
  };

  return (
    <div className='ribbit-tab__sticky' style={{ width: tabWidth }}>
      <div
        ref={listRef}
        role='tablist'
        aria-orientation='vertical'
        className='ribbit-tab__list'
        onKeyDown={onKeyDown}
      >
        {conditions.map((condition, index) => {
          const selected = index === selectedIndex;
          const hasMissingRequired = missingRequiredIds.has(condition.id);
          return (
            <button
              key={condition.id}
              type='button'
              role='tab'
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(index)}
              className={clsx('ribbit-tab__item', {
                'ribbit-tab__item--selected': selected,
              })}
            >
              <span className='ribbit-tab__label'>{condition.tabName}</span>
              {hasMissingRequired && (
                <span
                  className='ribbit-tab__badge'
                  role='img'
                  aria-label={t('desktop.tab.missingRequired')}
                  title={t('desktop.tab.missingRequired')}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
