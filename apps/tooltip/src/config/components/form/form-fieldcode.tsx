import { appFieldsAtom } from '@/config/states/kintone';
import { conditionFieldCodeAtom } from '@/config/states/plugin';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';

export default function FieldCodeForm() {
  const value = useAtomValue(conditionFieldCodeAtom);

  const onChange = useAtomCallback(
    useCallback((_, set, value: string) => {
      set(conditionFieldCodeAtom, value);
    }, [])
  );

  return (
    <JotaiFieldSelect fieldPropertiesAtom={appFieldsAtom} fieldCode={value} onChange={onChange} />
  );
}
