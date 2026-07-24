import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { stringFieldsAtom } from '@/config/states/kintone';
import { calendarNoteState, enablesNoteState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';

const handleNoteChangeAtom = atom(null, (_, set, code: string) => {
  set(calendarNoteState, code);
});

const Component: FC = () => {
  const enablesNote = useAtomValue(enablesNoteState);
  const noteField = useAtomValue(calendarNoteState);
  const onFieldChange = useSetAtom(handleNoteChangeAtom);

  if (!enablesNote) {
    return null;
  }

  return (
    <div className='mt-4 grid gap-4'>
      <JotaiFieldSelect
        //@ts-expect-error 型定義不足
        fieldPropertiesAtom={stringFieldsAtom}
        onChange={onFieldChange}
        fieldCode={noteField}
        placeholder={t('config.form.selectField')}
      />
    </div>
  );
};

export default Component;
