import { handleSearchInputChangeAtom, searchInputAtom } from '@/desktop/states/calendar';
import { t } from '@/lib/i18n-plugin';
import { TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';

export default function SidebarSearchInput() {
  const text = useAtomValue(searchInputAtom);
  const onChange = useSetAtom(handleSearchInputChangeAtom);

  return (
    <TextField
      variant='outlined'
      fullWidth
      label={t('desktop.sidebar.filterSchedule')}
      size='small'
      value={text}
      onChange={onChange}
    />
  );
}
