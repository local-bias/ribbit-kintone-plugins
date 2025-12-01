import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DeepReadonly } from 'utility-types';

type Props = DeepReadonly<{ field: kintoneAPI.field.Date }>;

export default function DateFieldValue({ field }: Props) {
  return <>{field.value ? new Date(field.value).toLocaleDateString() : ''}</>;
}
