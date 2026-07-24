import {
  RecurrenceEndCondition,
  RecurrenceFormState,
  RecurrenceFrequency,
  RecurrenceMonthlyMode,
} from '@/desktop/recurrence';
import { WEEK_DAYS } from '@/lib/calendar';
import { DatePicker } from '@/lib/components/date-picker';
import { t } from '@/lib/i18n-plugin';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { DateTime } from 'luxon';
import { FC } from 'react';

export const DEFAULT_RECURRENCE_FORM: RecurrenceFormState = {
  freq: 'WEEKLY',
  interval: 1,
  byweekday: [],
  monthlyMode: 'dayOfMonth',
  end: { type: 'never' },
};

export type RecurrenceFormChange = (updater: (form: RecurrenceFormState) => RecurrenceFormState) => void;

/**
 * 繰り返し設定の入力フォーム本体。呼び出し側の状態管理(独自ダイアログのJotaiアトム、または
 * kintoneレコード追加・編集画面の`kintone.app.record.set`)に依存しないよう、`onChange`で
 * 更新を通知するだけの制御されたコンポーネントとして実装する。
 */
export const RecurrenceFormInputs: FC<{ form: RecurrenceFormState; onChange: RecurrenceFormChange }> = ({
  form,
  onChange,
}) => {
  return (
    <div className='grid gap-3 pl-3 border-l-2 border-l-foreground/20'>
      <div className='flex items-center gap-2'>
        <TextField
          select
          size='small'
          label={t('desktop.dialog.recurrence.frequency')}
          value={form.freq}
          onChange={(e) => onChange((f) => ({ ...f, freq: e.target.value as RecurrenceFrequency }))}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value='DAILY'>{t('desktop.dialog.recurrence.frequency.daily')}</MenuItem>
          <MenuItem value='WEEKLY'>{t('desktop.dialog.recurrence.frequency.weekly')}</MenuItem>
          <MenuItem value='MONTHLY'>{t('desktop.dialog.recurrence.frequency.monthly')}</MenuItem>
          <MenuItem value='YEARLY'>{t('desktop.dialog.recurrence.frequency.yearly')}</MenuItem>
        </TextField>
        <TextField
          type='number'
          size='small'
          label={t('desktop.dialog.recurrence.interval')}
          value={form.interval}
          slotProps={{ htmlInput: { min: 1 } }}
          onChange={(e) =>
            onChange((f) => ({ ...f, interval: Math.max(1, Number(e.target.value) || 1) }))
          }
          sx={{ width: 100 }}
        />
      </div>

      {form.freq === 'WEEKLY' && (
        <FormGroup row>
          {WEEK_DAYS.map(({ label, value }) => (
            <FormControlLabel
              key={value}
              control={
                <Checkbox
                  size='small'
                  checked={form.byweekday.includes(value)}
                  onChange={(_, checked) =>
                    onChange((f) => ({
                      ...f,
                      byweekday: checked
                        ? [...f.byweekday, value]
                        : f.byweekday.filter((v) => v !== value),
                    }))
                  }
                />
              }
              label={label}
            />
          ))}
        </FormGroup>
      )}

      {form.freq === 'MONTHLY' && (
        <RadioGroup
          value={form.monthlyMode}
          onChange={(e) =>
            onChange((f) => ({ ...f, monthlyMode: e.target.value as RecurrenceMonthlyMode }))
          }
        >
          <FormControlLabel
            value='dayOfMonth'
            control={<Radio size='small' />}
            label={t('desktop.dialog.recurrence.monthlyMode.dayOfMonth')}
          />
          <FormControlLabel
            value='weekdayOfMonth'
            control={<Radio size='small' />}
            label={t('desktop.dialog.recurrence.monthlyMode.weekdayOfMonth')}
          />
        </RadioGroup>
      )}

      <RadioGroup
        value={form.end.type}
        onChange={(e) => {
          const type = e.target.value as RecurrenceEndCondition['type'];
          onChange((f) => ({
            ...f,
            end:
              type === 'never'
                ? { type: 'never' }
                : type === 'onDate'
                  ? { type: 'onDate', date: DateTime.now().plus({ months: 1 }).toFormat('yyyy-MM-dd') }
                  : { type: 'afterCount', count: 10 },
          }));
        }}
      >
        <FormControlLabel
          value='never'
          control={<Radio size='small' />}
          label={t('desktop.dialog.recurrence.end.never')}
        />
        <div className='flex items-center gap-2'>
          <FormControlLabel
            value='onDate'
            control={<Radio size='small' />}
            label={t('desktop.dialog.recurrence.end.onDate')}
          />
          {form.end.type === 'onDate' && (
            <DatePicker
              value={DateTime.fromISO(form.end.date)}
              onChange={(date) => {
                if (!(date instanceof DateTime)) return;
                onChange((f) => ({ ...f, end: { type: 'onDate', date: date.toFormat('yyyy-MM-dd') } }));
              }}
            />
          )}
        </div>
        <div className='flex items-center gap-2'>
          <FormControlLabel
            value='afterCount'
            control={<Radio size='small' />}
            label={t('desktop.dialog.recurrence.end.afterCount')}
          />
          {form.end.type === 'afterCount' && (
            <TextField
              type='number'
              size='small'
              value={form.end.count}
              slotProps={{ htmlInput: { min: 1 } }}
              onChange={(e) =>
                onChange((f) => ({
                  ...f,
                  end: { type: 'afterCount', count: Math.max(1, Number(e.target.value) || 1) },
                }))
              }
              sx={{ width: 80 }}
            />
          )}
        </div>
      </RadioGroup>
    </div>
  );
};
