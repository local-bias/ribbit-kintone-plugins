import styled from '@emotion/styled';
import { FC, useState, useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { toast } from 'sonner';
import { addTaskDialogOpenAtom, currentConditionAtom, ganttAppIdAtom } from '../public-state';
import { createNewTask, refreshRecords } from '../record-operations';
import { GUEST_SPACE_ID } from '@/lib/global';
import { getCategoryFieldCodes } from '@/lib/plugin';

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
  const condition = useAtomValue(currentConditionAtom);
  const appId = useAtomValue(ganttAppIdAtom);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(formatToday());
  const [endDate, setEndDate] = useState(formatToday());
  const [saving, setSaving] = useState(false);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTitle('');
    setStartDate(formatToday());
    setEndDate(formatToday());
  }, [setOpen]);

  const handleSave = useCallback(async () => {
    if (!condition || !appId) {
      return;
    }

    if (!title.trim()) {
      toast.warning('タイトルを入力してください');
      return;
    }

    if (!startDate || !endDate) {
      toast.warning('開始日と終了日を入力してください');
      return;
    }

    if (startDate > endDate) {
      toast.warning('終了日は開始日以降にしてください');
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

      toast.success('新しいタスクを追加しました');
      handleClose();
    } catch (error) {
      console.error('[gantt] Failed to create task:', error);
      toast.error('タスクの追加に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [condition, appId, title, startDate, endDate, handleClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>新規タスク追加</DialogTitle>
      <DialogContent>
        <FormField>
          <TextField
            label='タイトル'
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
            label='開始日'
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
            label='終了日'
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
          キャンセル
        </Button>
        <Button onClick={handleSave} variant='contained' disabled={saving}>
          {saving ? '追加中...' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
