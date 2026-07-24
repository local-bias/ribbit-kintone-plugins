import { LocalizationProvider, DatePicker as MUIDatePicker } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof MUIDatePicker>, 'renderInput' | 'mask'>;

export function DatePicker({ className, ...others }: Props) {
  return (
    <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={'ja'}>
      <div {...{ className }}>
        <MUIDatePicker {...others} />
      </div>
    </LocalizationProvider>
  );
}
