import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { recurrenceFieldsAtom } from '@/config/states/kintone';
import { calendarRecurrenceState, enablesRecurrenceState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';

const handleRecurrenceFieldChangeAtom = atom(null, (_, set, code: string) => {
  set(calendarRecurrenceState, code);
});

const Component: FC = () => {
  const enablesRecurrence = useAtomValue(enablesRecurrenceState);
  const recurrenceField = useAtomValue(calendarRecurrenceState);
  const onFieldChange = useSetAtom(handleRecurrenceFieldChangeAtom);

  if (!enablesRecurrence) {
    return null;
  }

  return (
    <div className='mt-4 grid gap-4'>
      <JotaiFieldSelect
        //@ts-expect-error 型定義不足
        fieldPropertiesAtom={recurrenceFieldsAtom}
        onChange={onFieldChange}
        fieldCode={recurrenceField}
        placeholder={t('config.form.selectField')}
      />
    </div>
  );
};

export default Component;
