import { JotaiFieldSelect } from '@/components/jotai/field-select';
import { assigneeFieldsAtom } from '@/config/states/kintone';
import { calendarAssigneeState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { useAtom } from 'jotai';

/** 予定の担当者として扱うフィールド(未設定の場合は担当者による絞り込みを行わない) */
export default function FormAssignee() {
  const [fieldCode, setFieldCode] = useAtom(calendarAssigneeState);

  return (
    <JotaiFieldSelect
      // @ts-expect-error 型定義不足
      fieldPropertiesAtom={assigneeFieldsAtom}
      onChange={setFieldCode}
      fieldCode={fieldCode}
      label={t('config.form.assigneeField')}
      placeholder={t('config.form.selectField')}
    />
  );
}
