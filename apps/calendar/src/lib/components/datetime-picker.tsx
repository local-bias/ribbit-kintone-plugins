import { LocalizationProvider, DateTimePicker as MUIDateTimePicker } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof MUIDateTimePicker>, 'renderInput' | 'mask'>;

export function DateTimePicker({ className, ...others }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={'ja'}>
      <div {...{ className }}>
        <MUIDateTimePicker {...others} />
      </div>
    </LocalizationProvider>
  );
}
