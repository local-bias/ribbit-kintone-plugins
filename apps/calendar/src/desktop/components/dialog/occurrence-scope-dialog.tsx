import {
  handleDeleteSeriesAtom,
  handleDeleteSingleOccurrenceAtom,
  handleEditSeriesAtom,
  handleEditSingleOccurrenceAtom,
  handleOccurrenceScopeCloseAtom,
  occurrenceScopeDialogShownAtom,
} from '@/desktop/states/recurrence';
import { t } from '@/lib/i18n-plugin';
import {
  Dialog,
  DialogTitle,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
} from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { FC } from 'react';

const Component: FC = () => {
  const open = useAtomValue(occurrenceScopeDialogShownAtom);
  const onClose = useSetAtom(handleOccurrenceScopeCloseAtom);
  const onEditThis = useSetAtom(handleEditSingleOccurrenceAtom);
  const onDeleteThis = useSetAtom(handleDeleteSingleOccurrenceAtom);
  const onEditSeries = useSetAtom(handleEditSeriesAtom);
  const onDeleteSeries = useSetAtom(handleDeleteSeriesAtom);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>{t('desktop.dialog.occurrenceScope.title')}</DialogTitle>
      <MenuList sx={{ minWidth: 260, pb: 2 }}>
        <MenuItem onClick={onEditThis}>
          <ListItemIcon>
            <Pencil className='w-5 h-5' />
          </ListItemIcon>
          <ListItemText>{t('desktop.dialog.occurrenceScope.editThis')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDeleteThis}>
          <ListItemIcon>
            <Trash2 className='w-5 h-5' />
          </ListItemIcon>
          <ListItemText>{t('desktop.dialog.occurrenceScope.deleteThis')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={onEditSeries}>
          <ListItemIcon>
            <CalendarDays className='w-5 h-5' />
          </ListItemIcon>
          <ListItemText>{t('desktop.dialog.occurrenceScope.editSeries')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDeleteSeries}>
          <ListItemIcon>
            <Trash2 className='w-5 h-5' />
          </ListItemIcon>
          <ListItemText>{t('desktop.dialog.occurrenceScope.deleteSeries')}</ListItemText>
        </MenuItem>
      </MenuList>
    </Dialog>
  );
};

export default Component;
