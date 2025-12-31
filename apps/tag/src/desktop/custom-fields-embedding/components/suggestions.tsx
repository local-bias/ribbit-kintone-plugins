import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { FC, RefObject } from 'react';
import { filteredSuggestionsAtom, suggestionCursorAtom } from '../states/plugin';

type Props = {
  className?: string;
  optionsRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  onSelect: (tag: string) => void;
};

const Component: FC<Props> = ({ className, optionsRef, open, onSelect }) => {
  const suggestions = useAtomValue(filteredSuggestionsAtom);
  const cursor = useAtomValue(suggestionCursorAtom);

  if (!open) {
    return null;
  }

  return (
    <div className={className}>
      <div ref={optionsRef}>
        {suggestions.length === 0 && <div className='not-found'>候補が見つかりませんでした</div>}
        {suggestions.map((tag, index) => (
          <div
            key={tag}
            data-cursor={index === cursor ? '' : undefined}
            onClick={() => onSelect(tag)}
            onMouseDown={(event) => event.preventDefault()}
          >
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Suggestions = styled(Component)`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  z-index: 50;
  padding: 8px 0;
  font-size: 14px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;

  > div {
    overflow-y: hidden;
    padding-left: 8px;
    padding-right: 8px;
    max-height: 300px;
    &:hover {
      padding-right: 0;
      overflow-y: auto;
    }

    .not-found {
      padding: 8px;
      color: #999;
    }

    & > div:not(.not-found) {
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      &:hover {
        background-color: #f5f5f5;
      }
      &:active {
        background-color: #ebebeb;
      }
      &[data-cursor] {
        background-color: #e3f2fd;
      }
    }
  }
`;
