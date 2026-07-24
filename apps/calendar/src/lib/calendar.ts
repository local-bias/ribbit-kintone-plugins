import { createDuration } from '@fullcalendar/core/internal';
import { t } from './i18n-plugin';

export const WEEK_DAYS = [
  { label: t('common.weekday.sunday'), value: 0 },
  { label: t('common.weekday.monday'), value: 1 },
  { label: t('common.weekday.tuesday'), value: 2 },
  { label: t('common.weekday.wednesday'), value: 3 },
  { label: t('common.weekday.thursday'), value: 4 },
  { label: t('common.weekday.friday'), value: 5 },
  { label: t('common.weekday.saturday'), value: 6 },
] as const;

export function getSlotTime(time: string) {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return createDuration({ hours, minutes, seconds });
}
