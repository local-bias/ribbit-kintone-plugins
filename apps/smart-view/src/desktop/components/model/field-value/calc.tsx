import { getCalcFieldValueAsString, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { useAtomValue } from 'jotai';
import { appFormPropertyAtom } from '../../../states/kintone';

type Props = { field: kintoneAPI.field.Calc; code: string; appId: string };

export default function CalcFieldValue({ field, code, appId }: Props) {
  const property = useAtomValue(
    appFormPropertyAtom({ appId, fieldCode: code })
  ) as kintoneAPI.property.Calc | null;

  if (!property || ['', undefined, null].includes(field.value)) {
    return <>{field.value}</>;
  }

  return <>{getCalcFieldValueAsString({ field, property })}</>;
}
