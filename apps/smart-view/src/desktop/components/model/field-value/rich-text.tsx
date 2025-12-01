import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DeepReadonly } from 'utility-types';

type Props = DeepReadonly<{ field: kintoneAPI.field.RichText }>;

export default function RichTextFieldValue(props: Props) {
  return <div dangerouslySetInnerHTML={{ __html: props.field.value }} />;
}
