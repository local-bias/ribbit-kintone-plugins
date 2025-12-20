import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { useAtom } from 'jotai';
import { appFieldsAtom } from '../../../states/kintone';
import { getConditionPropertyAtom } from '../../../states/plugin';

const state = getConditionPropertyAtom('targetFieldCode');

export default function TargetFieldSelect() {
  const [fieldCode, onChange] = useAtom(state);

  return (
    <JotaiFieldSelect
      fieldCode={fieldCode}
      onChange={onChange}
      fieldPropertiesAtom={appFieldsAtom}
    />
  );
}