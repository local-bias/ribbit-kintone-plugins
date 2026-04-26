import styled from '@emotion/styled';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { type FC, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getCategoryFieldCodes } from '@/lib/plugin';
import {
  addTaskDialogOpenAtom,
  addTaskInitialCategoryPathAtom,
  currentConditionAtom,
  ganttAppIdAtom,
} from '../public-state';
import { createNewTask, refreshRecords } from '../record-operations';

const FormField = styled.div`
  margin-bottom: 16px;
`;

function formatToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const AddTaskDialog: FC = () => {
  const open = useAtomValue(addTaskDialogOpenAtom);
  const setOpen = useSetAtom(addTaskDialogOpenAtom);
  const initialCategoryPath = useAtomValue(addTaskInitialCategoryPathAtom);
  const setInitialCategoryPath = useSetAtom(addTaskInitialCategoryPathAtom);
  const condition = useAtomValue(currentConditionAtom);
  const appId = useAtomValue(ganttAppIdAtom);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(formatToday());
  const [endDate, setEndDate] = useState(formatToday());
  const [saving, setSaving] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    setInitialCategoryPath(null);
    setTitle('');
    setStartDate(formatToday());
    setEndDate(formatToday());
  }, [setOpen, setInitialCategoryPath]);

  const handleSave = useCallback(async () => {
    if (!condition || !appId) {
      return;
    }

    if (!title.trim()) {
      toast.warning(t('desktop.toast.addTaskTitleRequired'));
      return;
    }

    if (!startDate || !endDate) {
      toast.warning(t('desktop.toast.addTaskDateRequired'));
      return;
    }

    if (startDate > endDate) {
      toast.warning(t('desktop.toast.addTaskDateInvalid'));
      return;
    }

    setSaving(true);

    try {
      await createNewTask({
        appId,
        titleFieldCode: condition.titleFieldCode,
        startDateFieldCode: condition.startDateFieldCode,
        endDateFieldCode: condition.endDateFieldCode,
        title: title.trim(),
        startDate,
        endDate,
        categoryFields: initialCategoryPath ?? undefined,
        guestSpaceId: GUEST_SPACE_ID,
      });

      const fields = [
        condition.titleFieldCode,
        condition.startDateFieldCode,
        condition.endDateFieldCode,
        condition.assigneeFieldCode,
        ...getCategoryFieldCodes(condition),
        condition.progressFieldCode,
      ].filter(Boolean);

      await refreshRecords({
        appId,
        fields,
        guestSpaceId: GUEST_SPACE_ID,
      });

      toast.success(t('desktop.toast.addTaskSuccess'));
      handleClose();
    } catch (error) {
      console.error('[gantt] Failed to create task:', error);
      toast.error(t('desktop.toast.addTaskError'));
    } finally {
      setSaving(false);
    }
  }, [condition, appId, title, startDate, endDate, initialCategoryPath, handleClose]);

  // カテゴリーを持つ場合のダイアログタイトル
  const dialogTitle =
    initialCategoryPath && initialCategoryPath.length > 0
      ? t(
          'desktop.addTask.titleWithCategory',
          initialCategoryPath[initialCategoryPath.length - 1]!.value || t('desktop.noGroup')
        )
      : t('desktop.addTask.title');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        {initialCategoryPath && initialCategoryPath.length > 0 && (
          <FormField>
            <Typography variant='caption' color='text.secondary' gutterBottom display='block'>
              {t('desktop.addTask.fieldCategory')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {initialCategoryPath.map((entry) => (
                <Chip
                  key={entry.fieldCode}
                  label={entry.value || t('desktop.noGroup')}
                  size='small'
                  variant='outlined'
                />
              ))}
            </Box>
          </FormField>
        )}
        <FormField>
          <TextField
            label={t('desktop.addTask.fieldTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
            margin='dense'
          />
        </FormField>
        <FormField>
          <TextField
            label={t('desktop.addTask.fieldStartDate')}
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            required
            margin='dense'
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </FormField>
        <FormField>
          <TextField
            label={t('desktop.addTask.fieldEndDate')}
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            required
            margin='dense'
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </FormField>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {t('desktop.addTask.cancel')}
        </Button>
        <Button onClick={handleSave} variant='contained' disabled={saving}>
          {saving ? t('desktop.addTask.saving') : t('desktop.addTask.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
