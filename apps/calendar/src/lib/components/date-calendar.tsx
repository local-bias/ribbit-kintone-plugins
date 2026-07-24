import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateCalendar as MuiDateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ComponentProps } from 'react';

export default function DateCalendar(props: ComponentProps<typeof MuiDateCalendar>) {
  return (
    <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={'ja'}>
      <MuiDateCalendar {...props} />
    </LocalizationProvider>
  );
}
