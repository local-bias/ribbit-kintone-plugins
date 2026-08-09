import TOC from '@/desktop/components/toc';
import TOCTitle from '@/desktop/components/toc-title';
import { pluginConfigAtom } from '@/desktop/state';
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';

interface ContainerProps {
  $minWidth: number;
  $maxWidth: number | null;
}

const EmbeddingContainer = styled.div<ContainerProps>`
  box-sizing: border-box;
  min-width: ${({ $minWidth }) => `${$minWidth}px`};
  max-width: ${({ $maxWidth }) => ($maxWidth ? `${$maxWidth}px` : 'none')};
  flex: 1;
  position: sticky;
  top: 130px;
  height: fit-content;
  max-height: calc(100vh - 150px);
  overflow-y: auto;

  /* スクロールバーのスタイリング */
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

export function StickyLeftEmbedding() {
  const { common } = useAtomValue(pluginConfigAtom);
  const maxWidth = common.maxWidth ?? 250;
  const minWidth = Math.min(maxWidth, 200);

  return (
    <EmbeddingContainer $minWidth={minWidth} $maxWidth={common.maxWidth}>
      <TOCTitle />
      <TOC />
    </EmbeddingContainer>
  );
}

