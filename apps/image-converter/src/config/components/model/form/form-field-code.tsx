import { currentAppFileFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { atom, useAtomValue, useSetAtom } from 'jotai';

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
      // @ts-expect-error 型定義不足
      fieldPropertiesAtom={currentAppFileFieldsAtom}
      label='ファイルを保存する添付ファイルフィールド'
      placeholder={''}
    />
  );
}
