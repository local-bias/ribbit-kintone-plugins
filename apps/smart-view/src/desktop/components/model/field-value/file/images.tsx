import styled from '@emotion/styled';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { Skeleton } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { fileUrlAtom } from '../../../../states/kintone';

type Props = { files: kintoneAPI.field.File['value'] };
type ImageProps = { file: kintoneAPI.field.File['value'][number] };

function Image({ file }: ImageProps) {
  const fileUrl = useAtomValue(fileUrlAtom(file.fileKey));
  if (!fileUrl) {
    return null;
  }
  return <img loading='lazy' src={fileUrl} />;
}

function ImageContainer(props: ImageProps) {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={50} height={50} />}>
      <Image {...props} />
    </Suspense>
  );
}

function Container({ className, files }: Props & { className?: string }) {
  return (
    <div className={className}>
      {files.map((file, i) => (
        <ImageContainer key={i} file={file} />
      ))}
    </div>
  );
}

const StyledContainer = styled(Container)`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
  }
`;

export default StyledContainer;
