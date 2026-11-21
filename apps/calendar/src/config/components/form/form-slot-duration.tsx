import { slotDurationState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { DEFAULT_SLOT_DURATION, SLOT_DURATION_OPTIONS } from '@/schema/calendar';
import { MenuItem, TextField } from '@mui/material';
import { useAtom } from 'jotai';

const toMinutes = (duration: string) => {
  const [hours = 0, minutes = 0] = duration.split(':').map(Number);
  return hours * 60 + minutes;
};

/** 時間枠ビューの1マスあたりの時間 */
export default function FormSlotDuration() {
  const [slotDuration, setSlotDuration] = useAtom(slotDurationState);

  return (
    <TextField
      label={t('config.form.slotDuration')}
      select
      variant='outlined'
      color='primary'
      onChange={(event) => setSlotDuration(event.target.value)}
      sx={{ width: '150px' }}
      value={slotDuration || DEFAULT_SLOT_DURATION}
    >
      {SLOT_DURATION_OPTIONS.map((duration) => (
        <MenuItem key={duration} value={duration}>
          {t('config.form.minutes', String(toMinutes(duration)))}
        </MenuItem>
      ))}
    </TextField>
  );
}
