import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, Suspense } from 'react';
import { textFieldsAtom } from '../../../states/kintone';
import { getConditionPropertyAtom } from '../../../states/plugin';

const state = getConditionPropertyAtom('configField');

const Component: FC = () => {
  const targetField = useAtomValue(state);
  const setTargetField = useSetAtom(state);

  const onFieldChange = (value: string) => {
    setTargetField(value);
  };

  return (
    <div>
      <JotaiFieldSelect
        fieldPropertiesAtom={textFieldsAtom}
        fieldCode={targetField}
        onChange={onFieldChange}
      />
    </div>
  );
};

export default function FieldConfigForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component />
    </Suspense>
  );
}
