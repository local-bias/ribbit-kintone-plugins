import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DeepReadonly } from 'utility-types';

type Props = DeepReadonly<{ field: kintoneAPI.field.MultiSelect }>;

export default function MultiSelectFieldValue(props: Props) {
  return (
    <>
      {props.field.value.map((value, i) => (
        <div key={i}>{value}</div>
      ))}
    </>
  );
}
