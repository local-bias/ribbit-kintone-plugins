import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { stringFieldsAtom } from '@/config/states/kintone';
import { calendarTitleState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC } from 'react';

const handleTitleChangeAtom = atom(null, (_, set, code: string) => {
  set(calendarTitleState, code);
});

const Component: FC = () => {
  const title = useAtomValue(calendarTitleState);
  const onChange = useSetAtom(handleTitleChangeAtom);

  return (
    <JotaiFieldSelect
      //@ts-expect-error 型定義不足
      fieldPropertiesAtom={stringFieldsAtom}
      onChange={onChange}
      fieldCode={title}
      placeholder={t('config.form.selectField')}
    />
  );
};

export default Component;
