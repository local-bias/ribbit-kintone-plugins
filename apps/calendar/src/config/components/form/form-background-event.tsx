import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { backgroundEventOptionsAtom, checkboxFieldsAtom } from '@/config/states/kintone';
import {
  backgroundEventOptionState,
  calendarBackgroundEventState,
  enablesBackgroundEventState,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { MenuItem, Skeleton, TextField } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Suspense } from 'react';

function BackgroundEventOptionForm() {
  const [option, setOption] = useAtom(backgroundEventOptionState);
  const options = useAtomValue(backgroundEventOptionsAtom);

  return (
    <TextField
      label={t('config.form.backgroundEventValue')}
      select
      variant='outlined'
      color='primary'
      onChange={(event) => setOption(event.target.value)}
      sx={{ width: '350px' }}
      value={options.includes(option) ? option : ''}
      error={!options.includes(option)}
      helperText={
        options.includes(option) ? undefined : t('config.form.backgroundEventValueRequired')
      }
    >
      {options.map((code) => (
        <MenuItem key={code} value={code}>
          {code}
        </MenuItem>
      ))}
    </TextField>
  );
}

/** 背景イベントとして表示するレコードを判定するフィールドと値 */
export default function FormBackgroundEvent() {
  const enables = useAtomValue(enablesBackgroundEventState);
  const [fieldCode, setFieldCode] = useAtom(calendarBackgroundEventState);
  const [, setOption] = useAtom(backgroundEventOptionState);

  // 選択肢はフィールドごとに異なるため、フィールドを変更したら値の選択もやり直してもらう
  const onFieldChange = (code: string) => {
    setFieldCode(code);
    setOption('');
  };

  if (!enables) {
    return null;
  }

  return (
    <div className='mt-4 grid gap-4'>
      <JotaiFieldSelect
        // @ts-expect-error 型定義不足
        fieldPropertiesAtom={checkboxFieldsAtom}
        onChange={onFieldChange}
        fieldCode={fieldCode}
        placeholder={t('config.form.selectField')}
      />
      <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
        <BackgroundEventOptionForm />
      </Suspense>
    </div>
  );
}
