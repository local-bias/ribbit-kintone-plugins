import styled from '@emotion/styled';
import { t } from '@/lib/i18n';
import { FolderDown } from 'lucide-react';
import { useState } from 'react';

const StyledButton = styled.button`
  height: 48px;
  padding: 0 24px 0 16px;
  border: 1px solid #e3e7e8;
  border-radius: 0;
  background-color: #f7f9fa;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: 48px;
  margin: 0 4px;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  transition:
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.2s ease;
  box-shadow: none;
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  gap: 8px;
  svg {
    color: #a8a8a8;
  }

  &:hover {
    border-color: #3498db;
    color: #3498db;
    svg {
      color: #3498db;
    }
  }

  &:active {
    background-color: #edf1f3;
  }

  &:disabled,
  &[data-loading='true'] {
    color: #999;
    cursor: wait;
    pointer-events: none;
    box-shadow: none;
  }
`;

type DownloadButtonProps = {
  label: string;
  onClick: () => Promise<void>;
};

export function DownloadButton({ label, onClick }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error(t('desktop.download.errorLog'), error);
      alert(t('desktop.download.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledButton
      type='button'
      disabled={isLoading}
      data-loading={isLoading ? 'true' : undefined}
      onClick={handleClick}
    >
      <FolderDown size={30} />
      {isLoading ? t('desktop.download.loading') : label}
    </StyledButton>
  );
}
