import { currentAppFieldPropertiesAtom } from '@/desktop/states/kintone';
import styled from '@emotion/styled';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { FieldValue } from '../field-value';

type Props = {
  fieldCode: string;
  field: kintoneAPI.Field;
  className?: string;
};

function ViewCardFieldLabel({ fieldCode }: { fieldCode: string; }) {
  const properties = useAtomValue(currentAppFieldPropertiesAtom);
  const property = Object.values(properties).find((p) => p.code === fieldCode);

  const label = property?.label ?? fieldCode;

  return <>{label}</>;
}

function ViewCardFieldComponent({ className, field, fieldCode }: Props) {
  return (
    <div className={className}>
      <div>
        <Suspense fallback={<div>{fieldCode}</div>}>
          <ViewCardFieldLabel fieldCode={fieldCode} />
        </Suspense>
      </div>
      <div>
        <FieldValue code={fieldCode} field={field} />
      </div>
    </div>
  );
}

const Container = styled(ViewCardFieldComponent)`
  > div:nth-of-type(1) {
    font-size: 12px;
    color: #000a;
  }
`;

export default function ViewCardField(props: Props) {
  return <Container {...props} />;
}
