import { LANGUAGE } from '@/lib/global';
import { getNumberFieldValueAsString, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { useAtomValue } from 'jotai';
import { appFormPropertyAtom } from '../../../states/kintone';

type Props = { field: kintoneAPI.field.Number; code: string; appId: string };

export default function NumberFieldValue({ field, code, appId }: Props) {
  const property = useAtomValue(
    appFormPropertyAtom({ appId, fieldCode: code })
  ) as kintoneAPI.property.Number | null;

  if (!property || ['', undefined, null].includes(field.value)) {
    return <>{field.value}</>;
  }

  return <>{getNumberFieldValueAsString({ field, property, locales: LANGUAGE })}</>;
}
