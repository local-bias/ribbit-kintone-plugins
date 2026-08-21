import { t } from '@/lib/i18n-plugin';
import { cn } from '@/lib/utils';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { Eye, EyeOff } from 'lucide-react';
import { FC, memo, Suspense } from 'react';
import {
  calendarEventCategoryAtom,
  categoryFieldPropertyAtom,
  pluginConditionAtom,
} from '../../states/kintone';
import { displayingCategoriesAtom } from '../../states/sidebar';
import { DEFAULT_COLORS } from '../../static';

const handleCategoryChangeAtom = atom(null, async (get, set, category: string) => {
  const categories = (await get(calendarEventCategoryAtom)) ?? [];
  set(displayingCategoriesAtom, (current) => {
    const newArray = current === null ? categories : [...current];

    if (newArray.includes(category)) {
      return newArray.filter((item) => item !== category);
    }
    return [...newArray, category];
  });
});

const Component: FC<{ categories: string[]; }> = memo(({ categories }) => {
  const displayingCategories = useAtomValue(displayingCategoriesAtom);
  const onCategoryChange = useSetAtom(handleCategoryChangeAtom);
  const condition = useAtomValue(pluginConditionAtom);
  const colors = condition?.colors ?? DEFAULT_COLORS;

  const isShown = (category: string) =>
    displayingCategories === null || displayingCategories.includes(category);

  return (
    <div className='rad:grid rad:py-3'>
      {categories.map((category, i) => (
        <div
          key={i}
          className={cn(
            'rad:flex rad:text-sm rad:justify-between rad:items-center rad:text-foreground rad:cursor-pointer rad:transition-colors rad:hover:bg-muted rad:py-1 rad:px-2 rad:rounded-md',
            {
              'rad:text-foreground/30': !isShown(category),
            }
          )}
          onClick={() => onCategoryChange(category)}
        >
          <div className='rad:flex rad:items-center rad:gap-2'>
            <div
              style={{ backgroundColor: colors[i % colors.length] }}
              className='rad:w-4 rad:h-4 rad:rounded-xs'
            ></div>
            <div>{category}</div>
          </div>
          {isShown(category) ? (
            <Eye strokeWidth={1.5} className='rad:w-4 rad:h-4 rad:text-foreground/50' />
          ) : (
            <EyeOff strokeWidth={1.5} className='rad:w-4 rad:h-4 rad:text-foreground/50' />
          )}
        </div>
      ))}
    </div>
  );
});

const CategoryTitle: FC = () => {
  const condition = useAtomValue(pluginConditionAtom);
  const categoryFieldProperty = useAtomValue(categoryFieldPropertyAtom);

  if (!categoryFieldProperty) {
    return <>{condition?.calendarEvent.categoryField ?? t('desktop.sidebar.category')}</>;
  }
  return <>{categoryFieldProperty.label}</>;
};

const CategoryTitleContainer: FC = () => {
  return (
    <div className='rad:text-xs rad:text-foreground/70'>
      <Suspense fallback={<>{t('desktop.sidebar.category')}</>}>
        <CategoryTitle />
      </Suspense>
    </div>
  );
};

const Container: FC = () => {
  const categories = useAtomValue(calendarEventCategoryAtom);

  if (!categories) {
    return null;
  }

  return (
    <>
      <CategoryTitleContainer />
      <Component categories={categories} />
    </>
  );
};

export default Container;
