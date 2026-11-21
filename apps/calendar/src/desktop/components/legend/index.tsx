import { calendarEventCategoryAtom, pluginConditionAtom } from '@/desktop/states/kintone';
import { displayingCategoriesAtom, toggleDisplayingCategoryAtom } from '@/desktop/states/sidebar';
import { DEFAULT_COLORS } from '@/desktop/static';
import { t } from '@/lib/i18n-plugin';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';

function LegendItems() {
  const categories = useAtomValue(calendarEventCategoryAtom);
  const condition = useAtomValue(pluginConditionAtom);
  const displayingCategories = useAtomValue(displayingCategoriesAtom);
  const toggle = useSetAtom(toggleDisplayingCategoryAtom);

  if (!condition?.showsLegend || !categories?.length) {
    return null;
  }
  const colors = condition.colors.length ? condition.colors : DEFAULT_COLORS;

  return (
    <ul
      aria-label={t('desktop.legend.label')}
      className='rad:flex rad:flex-wrap rad:items-center rad:gap-x-1 rad:gap-y-1 rad:px-2 rad:md:px-4 rad:pt-2 rad:list-none rad:m-0'
    >
      {categories.map((category, i) => {
        const shown = displayingCategories === null || displayingCategories.includes(category);
        return (
          <li key={category}>
            <button
              type='button'
              aria-pressed={shown}
              onClick={() => toggle(category)}
              className={cn(
                'rad:flex rad:items-center rad:gap-1.5 rad:rounded-full rad:px-2 rad:py-0.5 rad:text-xs rad:text-foreground/80 rad:transition-colors rad:hover:bg-muted',
                { 'rad:text-foreground/30 rad:line-through': !shown }
              )}
            >
              <span
                className={cn('rad:inline-block rad:w-3 rad:h-3 rad:rounded-full', {
                  'rad:opacity-30': !shown,
                })}
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              {category}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** カレンダーの上部に表示する、カテゴリーごとの色の凡例 */
export default function CalendarLegend() {
  return (
    <Suspense fallback={null}>
      <LegendItems />
    </Suspense>
  );
}
