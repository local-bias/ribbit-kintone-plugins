import { visibleViewsState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { type CalendarViewType, VIEW_BUTTON_ORDER } from '@/schema/calendar';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useAtom } from 'jotai';

const VIEW_LABEL_KEYS = {
  dayGridMonth: 'config.initialView.dayGridMonth',
  timeGridWeek: 'config.initialView.timeGridWeek',
  timeGridFiveDay: 'config.initialView.timeGridFiveDay',
  timeGridThreeDay: 'config.initialView.timeGridThreeDay',
  timeGridDay: 'config.initialView.timeGridDay',
} as const satisfies Record<CalendarViewType, Parameters<typeof t>[0]>;

/** ヘッダーに表示する、表示形式の切り替えボタン */
export default function FormVisibleViews() {
  const [visibleViews, setVisibleViews] = useAtom(visibleViewsState);

  const onChange = (view: CalendarViewType, checked: boolean) => {
    setVisibleViews((current) =>
      checked ? [...current.filter((v) => v !== view), view] : current.filter((v) => v !== view)
    );
  };

  return (
    <FormGroup>
      {VIEW_BUTTON_ORDER.map((view) => (
        <FormControlLabel
          key={view}
          control={
            <Checkbox
              checked={visibleViews.includes(view)}
              onChange={(_, checked) => onChange(view, checked)}
            />
          }
          label={t(VIEW_LABEL_KEYS[view])}
        />
      ))}
    </FormGroup>
  );
}
