import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { stringFieldsAtom } from '@/config/states/kintone';
import { targetFieldState } from '@/config/states/plugin';

const handleFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(targetFieldState, value);
});

export default function TargetFieldSelect() {
  const fieldCode = useAtomValue(targetFieldState);
  const onChange = useSetAtom(handleFieldCodeChangeAtom);

  return (
    <JotaiFieldSelect
      fieldCode={fieldCode}
      onChange={onChange}
      fieldPropertiesAtom={stringFieldsAtom}
    />
  );
}
