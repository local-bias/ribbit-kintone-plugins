import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DeepReadonly } from 'utility-types';

type Props = DeepReadonly<{
  field:
    | kintoneAPI.field.UserSelect
    | kintoneAPI.field.GroupSelect
    | kintoneAPI.field.OrganizationSelect
    | kintoneAPI.field.StatusAssignee;
}>;

export default function EntityFieldValue({ field }: Props) {
  return (
    <>
      {field.value.map((value, i) => (
        <div key={i}>{value.name}</div>
      ))}
    </>
  );
}
