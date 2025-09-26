import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { appFieldsAtom } from '../../../states/kintone';
import { getConditionPropertyAtom } from '../../../states/plugin';

const state = getConditionPropertyAtom('targetFieldCode');


const handleFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(state, value);
});

export default function TargetFieldSelect() {
  const fieldCode = useAtomValue(state);
  const onChange = useSetAtom(handleFieldCodeChangeAtom);

  return (
    <JotaiFieldSelect
      fieldCode={fieldCode}
      onChange={onChange}
      fieldPropertiesAtom={appFieldsAtom}
    />
  );
}