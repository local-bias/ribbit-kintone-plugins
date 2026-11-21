import { getRangePosition } from '@/desktop/calendar-focus';
import { calendarVisibleRangeAtom } from '@/desktop/states/calendar-focus';
import { alpha, styled } from '@mui/material/styles';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { useAtomValue } from 'jotai';
import type { DateTime } from 'luxon';

/**
 * 日付セルの高さ(28px。`components/index.tsx`で`.MuiPickersDay-root`のサイズを固定している)の
 * 半分。帯の端を日付の丸と同じ曲率で丸める
 */
const BAND_END_RADIUS = '14px';

/**
 * メインのカレンダーの表示期間を示す帯。日付セルの背後に敷き、選択中の日付の丸は帯の上に
 * 重ねて表示する。
 *
 * 帯の端は、期間の初日・最終日に加えて、週の行の先頭・末尾(`:first-child`/`:last-child`)
 * でも丸める。メインのカレンダーとミニカレンダーで週の始まりの曜日が異なる場合でも、
 * 行の途中で途切れた帯に見えないようにするため。
 */
const DayBand = styled('span')(({ theme }) => ({
  display: 'flex',
  '&[data-range]': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
  '&[data-range="start"], &[data-range]:first-of-type': {
    borderTopLeftRadius: BAND_END_RADIUS,
    borderBottomLeftRadius: BAND_END_RADIUS,
  },
  '&[data-range="end"], &[data-range]:last-of-type': {
    borderTopRightRadius: BAND_END_RADIUS,
    borderBottomRightRadius: BAND_END_RADIUS,
  },
}));

/** ミニカレンダー(MUI DateCalendar)の日付セル。メインのカレンダーの表示期間を帯で示す */
export default function RangeDay(props: PickersDayProps) {
  const range = useAtomValue(calendarVisibleRangeAtom);
  // AdapterLuxonを使用しているため、日付はLuxonのDateTimeで渡される
  const date = (props.day as DateTime).toISODate();
  // 前後の月の日付(非表示のセル)には帯を描かない
  const position = date && !props.outsideCurrentMonth ? getRangePosition(date, range) : null;

  return (
    <DayBand role='presentation' data-range={position ?? undefined}>
      <PickersDay {...props} />
    </DayBand>
  );
}
