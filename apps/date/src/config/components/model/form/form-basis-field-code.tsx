import { targetFieldsAtom } from '@/config/states/kintone';
import { basisFieldCodeAtom, basisTypeAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { atom, useAtomValue, useSetAtom } from 'jotai';

const handleBasisFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(basisFieldCodeAtom, value);
});

function FormComponent() {
  const fieldCode = useAtomValue(basisFieldCodeAtom);
  const onChange = useSetAtom(handleBasisFieldCodeChangeAtom);

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={targetFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.basisFieldCode.label')}
    />
  );
}

export default function BasisFieldCodeForm() {
  const basisType = useAtomValue(basisTypeAtom);

  if (basisType !== 'field') {
    return null;
  }

  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.basisFieldCode.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.condition.basisFieldCode.description')}
      </PluginFormDescription>
      <FormComponent />
    </PluginFormSection>
  );
}
