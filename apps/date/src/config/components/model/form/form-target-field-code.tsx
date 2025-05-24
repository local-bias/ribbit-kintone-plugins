import { targetFieldsAtom } from '@/config/states/kintone';
import { targetFieldCodeAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';

const handleTargetFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(targetFieldCodeAtom, value);
});

export default function TargetFieldCodeForm() {
  const fieldCode = useAtomValue(targetFieldCodeAtom);
  const onChange = useSetAtom(handleTargetFieldCodeChangeAtom);

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={targetFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.targetFieldCode.label')}
      placeholder={t('config.condition.targetFieldCode.placeholder')}
    />
  );
}
