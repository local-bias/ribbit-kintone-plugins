import styled from '@emotion/styled';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { Skeleton } from '@mui/material';
import { useAtom } from 'jotai';
import { type FC, memo, Suspense } from 'react';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { currentAppStringFieldsAtom } from '../../../states/kintone';

const conditionPropertyAtom = getConditionPropertyAtom('fieldCode');

const Component: FC = () => {
  const [fieldCode, setFieldCode] = useAtom(conditionPropertyAtom);

  const onChange = (code: string) => {
    setFieldCode(code);
  };

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={currentAppStringFieldsAtom}
      onChange={(code) => onChange(code)}
      fieldCode={fieldCode}
      label={t('config.condition.fieldCode.label')}
      placeholder={t('config.condition.fieldCode.placeholder')}
    />
  );
};

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PlaceholderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Placeholder: FC = () => (
  <PlaceholderContainer>
    {new Array(3).fill('').map((_, i) => (
      <PlaceholderRow key={i}>
        <Skeleton variant='rounded' width={400} height={56} />
        <Skeleton variant='circular' width={24} height={24} />
        <Skeleton variant='circular' width={24} height={24} />
      </PlaceholderRow>
    ))}
  </PlaceholderContainer>
);

const Container: FC = () => (
  <Suspense fallback={<Placeholder />}>
    <Component />
  </Suspense>
);

export default memo(Container);
