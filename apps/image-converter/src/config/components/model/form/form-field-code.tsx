import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { currentAppFileFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';

const fieldCodeAtom = getConditionPropertyAtom('targetFileFieldCode');

const handleFieldCodeChange = atom(null, (_, set, newValue: string) => {
  set(fieldCodeAtom, newValue);
});

export default function FileFieldCodeForm() {
  const fieldCode = useAtomValue(fieldCodeAtom);
  const onChange = useSetAtom(handleFieldCodeChange);

  return (
    <JotaiFieldSelect
      fieldCode={fieldCode}
      onChange={onChange}
      fieldPropertiesAtom={currentAppFileFieldsAtom}
      label='ファイルを保存する添付ファイルフィールド'
      placeholder={''}
    />
  );
}
