import { appFormPropertyAtom } from '@/desktop/states/kintone';
import { type kintoneAPI } from '@konomi-app/kintone-utilities';
import { useAtomValue } from 'jotai';

type Props = {
  field: kintoneAPI.field.Link;
  code: string;
  appId: string;
};

export default function LinkFieldValue({ field, code, appId }: Props) {
  const property = useAtomValue(
    appFormPropertyAtom({ appId, fieldCode: code })
  ) as kintoneAPI.property.Link | null;

  if (!property || ['', undefined, null].includes(field.value)) {
    return <>{field.value}</>;
  }

  switch (property.protocol) {
    case 'WEB':
      return (
        <a href={field.value} target='_blank' rel='noopener noreferrer'>
          {field.value}
        </a>
      );
    case 'CALL':
      return <a href={`tel:${field.value}`}>{field.value}</a>;
    case 'MAIL':
      return <a href={`mailto:${field.value}`}>{field.value}</a>;
    default:
      return <>{field.value}</>;
  }
}
