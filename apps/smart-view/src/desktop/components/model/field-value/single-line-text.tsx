import type { kintoneAPI } from '@konomi-app/kintone-utilities';

type Props = { field: kintoneAPI.field.SingleLineText };

export default function SingleLineTextFieldValue(props: Props) {
  return <>{props.field.value}</>;
}
