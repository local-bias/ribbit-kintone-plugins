import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DeepReadonly } from 'utility-types';

type Props = DeepReadonly<{
  field: kintoneAPI.field.DateTime | kintoneAPI.field.CreatedTime | kintoneAPI.field.UpdatedTime;
}>;

export default function DatetimeFieldValue({ field }: Props) {
  return <>{field.value ? new Date(field.value).toLocaleString() : ''}</>;
}
