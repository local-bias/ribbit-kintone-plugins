import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { alldayOptionsAtom, checkboxFieldsAtom } from '@/config/states/kintone';
import { alldayOptionState, calendarAllDayState, enablesAllDayState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { MenuItem, Skeleton, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC, Suspense } from 'react';

const handleAllDayFieldChangeAtom = atom(null, (_, set, code: string) => {
  set(calendarAllDayState, code);
});

const handleAllDayOptionChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(alldayOptionState, event.target.value);
  }
);

const AllDayOptionForm: FC = () => {
  const alldayOption = useAtomValue(alldayOptionState);
  const alldayOptions = useAtomValue(alldayOptionsAtom);
  const onAllDayOptionChange = useSetAtom(handleAllDayOptionChangeAtom);

  return (
    <TextField
      label={t('config.form.allDayValue')}
      select
      variant='outlined'
      color='primary'
      onChange={onAllDayOptionChange}
      sx={{ width: '350px' }}
      value={alldayOption}
    >
      {alldayOptions.map((code) => (
        <MenuItem key={`allDayOptions-${code}`} value={code}>
          {code}
        </MenuItem>
      ))}
    </TextField>
  );
};

const AllDayOptionFormPlaceholder: FC = () => {
  return <Skeleton variant='rounded' width={350} height={56} />;
};

const Component: FC = () => {
  const enablesAllday = useAtomValue(enablesAllDayState);
  const alldayField = useAtomValue(calendarAllDayState);
  const onFieldChange = useSetAtom(handleAllDayFieldChangeAtom);

  if (!enablesAllday) {
    return null;
  }

  return (
    <div className='mt-4 grid gap-4'>
      <JotaiFieldSelect
        // @ts-expect-error 型定義不足
        fieldPropertiesAtom={checkboxFieldsAtom}
        onChange={onFieldChange}
        fieldCode={alldayField}
        placeholder={t('config.form.selectField')}
      />
      <Suspense fallback={<AllDayOptionFormPlaceholder />}>
        <AllDayOptionForm />
      </Suspense>
    </div>
  );
};

const AllDayForm: FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  );
};

export default AllDayForm;
