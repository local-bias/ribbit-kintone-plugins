import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Loader2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';
import { HeaderIconButton } from './styles';

const HiddenInput = styled.input`
  display: none;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningLoader = styled(Loader2)`
  animation: ${spin} 0.8s linear infinite;
`;

interface Props {
  uploading?: boolean;
  onFilesSelected: (files: File[]) => void;
}

/**
 * 「Googleドライブ」見出しの右端に配置する、アイコンのみのファイル追加ボタンです
 *
 * アップロード中は、進行中であることが視覚的にわかるよう回転するローディングアイコンに差し替えます
 */
function UploadIconButton({ uploading, onFilesSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    event.target.value = '';
  };

  return (
    <>
      <HeaderIconButton
        type='button'
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        title={uploading ? 'アップロード中...' : 'ファイルをアップロード'}
      >
        {uploading ? (
          <SpinningLoader size={15} strokeWidth={1.75} />
        ) : (
          <Upload size={15} strokeWidth={1.75} />
        )}
      </HeaderIconButton>
      <HiddenInput ref={inputRef} type='file' multiple disabled={uploading} onChange={onChange} />
    </>
  );
}

export default UploadIconButton;
