import { daysOfWeekAtom } from '@/config/states/plugin';
import { WEEK_DAYS } from '@/lib/calendar';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';

const handleDaysOfWeekChange = atom(
  null,
  (_, set, value: (typeof WEEK_DAYS)[number]['value'], checked: boolean) => {
    set(daysOfWeekAtom, (prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
  }
);

export default function DaysOfWeekForm() {
  const values = useAtomValue(daysOfWeekAtom);
  const onChange = useSetAtom(handleDaysOfWeekChange);

  return (
    <FormGroup>
      {WEEK_DAYS.map(({ label, value }) => (
        <FormControlLabel
          key={value}
          control={
            <Checkbox
              checked={values.includes(value)}
              onChange={(_, checked) => {
                onChange(value, checked);
              }}
            />
          }
          label={label}
        />
      ))}
    </FormGroup>
  );
}
