import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { displayTitleFieldsAtom } from '@/config/states/kintone';
import { calendarDisplayTitleState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { useAtom } from 'jotai';

/** カレンダー上に表示するタイトル(任意)。未設定の場合は入力用のタイトルを表示する */
export default function FormDisplayTitle() {
  const [fieldCode, setFieldCode] = useAtom(calendarDisplayTitleState);

  return (
    <JotaiFieldSelect
      // @ts-expect-error 型定義不足
      fieldPropertiesAtom={displayTitleFieldsAtom}
      onChange={setFieldCode}
      fieldCode={fieldCode}
      label={t('config.form.displayTitleField')}
      placeholder={t('config.form.selectField')}
    />
  );
}
