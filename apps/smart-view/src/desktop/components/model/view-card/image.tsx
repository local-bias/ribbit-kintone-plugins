import { fileUrlAtom } from '@/desktop/states/kintone';
import styled from '@emotion/styled';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { Skeleton } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Suspense } from 'react';
import ViewCardNoImage from './no-image';

type Props = { file: kintoneAPI.field.File['value'][number] | null; className?: string; };
type ImageProps = { file: kintoneAPI.field.File['value'][number]; };

function ViewCardImage({ file }: ImageProps) {
  const fileUrl = useAtomValue(fileUrlAtom(file.fileKey));
  if (!fileUrl) {
    return null;
  }
  return <img loading='lazy' src={fileUrl} />;
}

function ViewCardImageSuspense({ file }: ImageProps) {
  return (
    <Suspense fallback={<Skeleton variant='rectangular' width='100%' height='100%' />}>
      <ViewCardImage file={file} />
    </Suspense>
  );
}

export default function ViewCardImageContainer({ className, file }: Props) {
  return <Container className={className}>{file ? <ViewCardImageSuspense file={file} /> : <ViewCardNoImage />}</Container>;
}

const Container = styled.div`
  display: grid;
  overflow: hidden;
  img {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
`;
