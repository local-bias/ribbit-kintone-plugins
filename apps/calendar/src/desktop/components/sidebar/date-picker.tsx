import {
  calendarFocusRevisionAtom,
  focusCalendarDateAtom,
  focusedDateAtom,
} from '@/desktop/states/calendar-focus';
import DateCalendar from '@/lib/components/date-calendar';
import type { PickerSelectionState, PickerValue } from '@mui/x-date-pickers/internals';
import { useAtomValue, useSetAtom } from 'jotai';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import RangeDay from './range-day';

const SLOTS = { day: RangeDay };

/**
 * サイドバーのミニカレンダー。メインのカレンダーと双方向に連動する。
 *
 * - 選択中の日付は、メインのカレンダーの「現在の日付」(`focusedDateAtom`)と同期する。
 *   メインのカレンダーで移動すると、ミニカレンダーの表示月も選択中の日付の月へ戻る
 *   (MUIのDateCalendarは、`value`の参照が変わると表示月をその日付の月へ移動する)
 * - メインのカレンダーの表示期間は、日付セル(`RangeDay`)の背後に帯で示す
 */
export default function SidebarDatePicker() {
  const focusedDate = useAtomValue(focusedDateAtom);
  const revision = useAtomValue(calendarFocusRevisionAtom);
  const focusDate = useSetAtom(focusCalendarDateAtom);

  // DateCalendarは`value`の参照が変わるたびに表示月を移動する。メインのカレンダーが移動した
  // とき(`revision`が増えたとき)だけ作り直し、ミニカレンダー上で別の月を見ている途中に
  // 表示月が勝手に戻らないようにする
  // biome-ignore lint/correctness/useExhaustiveDependencies: revisionは作り直すきっかけとしてのみ使う
  const value = useMemo(
    () => (focusedDate ? DateTime.fromISO(focusedDate) : null),
    [focusedDate, revision]
  );

  const onChange = (date: PickerValue, selectionState?: PickerSelectionState) => {
    // 年の一覧で年を選んだだけ(日付の一覧へ切り替わる途中)の場合は、閲覧のための操作なので
    // メインのカレンダーを移動しない
    if (selectionState === 'partial') {
      return;
    }
    if (!(date instanceof DateTime) || !date.isValid) {
      return;
    }
    const isoDate = date.toISODate();
    if (isoDate) {
      focusDate(isoDate);
    }
  };

  return (
    <div className='rad:-mb-20!'>
      <DateCalendar
        className='rad:w-full! rad:aspect-square'
        value={value}
        onChange={onChange}
        slots={SLOTS}
      />
    </div>
  );
}
