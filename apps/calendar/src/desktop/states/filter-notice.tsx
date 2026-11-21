import { isShownUnderFilters } from '@/desktop/event-filters';
import { t } from '@/lib/i18n-plugin';
import { store } from '@/lib/store';
import { Button } from '@mui/material';
import { atom } from 'jotai';
import { closeSnackbar, enqueueSnackbar } from 'notistack';
import { calendarEventsAtom, calendarFiltersAtom, searchInputAtom } from './calendar';
import { displayingAssigneesAtom, displayingCategoriesAtom } from './sidebar';

/** 「絞り込みを解除」を押す猶予を持たせるため、通常の通知より長く表示する */
const NOTICE_DURATION_MS = 10000;

/** サイドバーの絞り込み(カテゴリー・担当者・キーワード検索)をすべて解除します */
export const resetCalendarFiltersAtom = atom(null, (_, set) => {
  set(displayingCategoriesAtom, null);
  set(displayingAssigneesAtom, null);
  set(searchInputAtom, '');
});

/** 予定が、現在の絞り込みの条件によってカレンダーに表示されないかどうかを返します */
export const isHiddenByFiltersAtom = atom(null, (get, _, eventId: string | undefined): boolean => {
  const event = eventId ? get(calendarEventsAtom).find(({ id }) => id === eventId) : undefined;
  return !!event && !isShownUnderFilters(event, get(calendarFiltersAtom));
});

/**
 * 保存した予定が、現在の絞り込みの条件によってカレンダーに表示されない場合に知らせます
 *
 * 保存直後に予定が消えると保存に失敗したように見えるため、絞り込みで非表示になっていることと、
 * 絞り込みを解除する操作を案内する。保存後の再取得などで予定の内容が確定してから呼び出すこと
 */
export const notifyIfHiddenByFiltersAtom = atom(null, (_, set, eventId: string | undefined) => {
  if (!set(isHiddenByFiltersAtom, eventId)) {
    return;
  }

  enqueueSnackbar(t('desktop.toast.hiddenByFilters'), {
    variant: 'info',
    autoHideDuration: NOTICE_DURATION_MS,
    action: (snackbarId) => (
      <Button
        color='inherit'
        size='small'
        onClick={() => {
          // 通知の表示後に押されるため、書き込み関数の外からストアを直接更新する
          store.set(resetCalendarFiltersAtom);
          closeSnackbar(snackbarId);
        }}
      >
        {t('desktop.toast.clearFilters')}
      </Button>
    ),
  });
});
