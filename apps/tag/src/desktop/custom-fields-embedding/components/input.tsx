import { KintoneInput } from '@/lib/components/kintone-input';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { produce } from 'immer';
import { useAtom, useSetAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import {
  ChangeEventHandler,
  FC,
  FocusEventHandler,
  KeyboardEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  filteredSuggestionsAtom,
  inputValueAtom,
  suggestionCursorAtom,
  tagDataAtom,
} from '../states/plugin';
import { Suggestions } from './suggestions';

type Props = { className?: string; width: number; enableSuggestion: boolean };

const Component: FC<Props> = ({ className, enableSuggestion }) => {
  const [inputValue, setInputValue] = useAtom(inputValueAtom);
  const setTagData = useSetAtom(tagDataAtom);
  const setSuggestionCursor = useSetAtom(suggestionCursorAtom);
  const optionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [manualClosed, setManualClosed] = useState(false);

  const onInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputValue(event.target.value);
    setSuggestionCursor(-1);
    // 文字入力時は手動クローズ状態を解除してサジェストを開く
    if (enableSuggestion && manualClosed) {
      setManualClosed(false);
      setOpen(true);
    } else if (enableSuggestion && !open) {
      setOpen(true);
    }
  };

  const addTag = useCallback(
    (tag: string) => {
      if (!tag) {
        return;
      }
      setTagData((current) =>
        produce(current, (draft) => {
          // 重複チェック
          if (!draft.tags.some((t) => t.value === tag)) {
            draft.tags.push({ value: tag });
          }
        })
      );
      setInputValue('');
      setSuggestionCursor(-1);
    },
    [setTagData, setInputValue, setSuggestionCursor]
  );

  const onInputKeyDown: KeyboardEventHandler<HTMLInputElement> = useAtomCallback(
    (get, set, event) => {
      // サジェスト無効時はEnterのみ処理
      if (!enableSuggestion) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (inputValue) {
            addTag(inputValue);
          }
        }
        return;
      }

      const suggestions = get(filteredSuggestionsAtom);
      let cursor = get(suggestionCursorAtom);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        cursor = Math.min(cursor + 1, suggestions.length - 1);
        set(suggestionCursorAtom, cursor);
        scrollToCursor(optionsRef, cursor);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        cursor = Math.max(cursor - 1, -1);
        set(suggestionCursorAtom, cursor);
        if (cursor >= 0) {
          scrollToCursor(optionsRef, cursor);
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedSuggestion = suggestions[cursor];
        if (cursor >= 0 && selectedSuggestion) {
          addTag(selectedSuggestion);
        } else if (inputValue) {
          addTag(inputValue);
        }
        return;
      }

      if (event.key === 'Escape') {
        setOpen(false);
        setManualClosed(true);
        setSuggestionCursor(-1);
        return;
      }
    }
  );

  const onInputClick = () => {
    if (enableSuggestion && !open) {
      setManualClosed(false);
      setOpen(true);
    }
  };

  const onFocus: FocusEventHandler<HTMLInputElement> = () => {
    // 手動で閉じられていない場合のみ開く
    if (enableSuggestion && !open && !manualClosed) {
      setOpen(true);
    }
  };

  const onBlur: FocusEventHandler<HTMLDivElement> = () => {
    setTimeout(() => {
      setOpen(false);
      setSuggestionCursor(-1);
    }, 0);
  };

  const onAddButtonClick = () => {
    if (inputValue) {
      addTag(inputValue);
    }
    setManualClosed(true);
    inputRef.current?.focus();
  };

  const onSelectSuggestion = (tag: string) => {
    addTag(tag);
    setOpen(false);
    setManualClosed(true);
  };

  return (
    <div className={className} onBlur={onBlur}>
      <div className='input-wrapper'>
        <KintoneInput
          ref={inputRef}
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onClick={onInputClick}
          onFocus={onFocus}
          placeholder='タグを入力...'
        />
        {enableSuggestion && (
          <Suggestions optionsRef={optionsRef} open={open} onSelect={onSelectSuggestion} />
        )}
      </div>
      <Button
        variant='contained'
        color='primary'
        size='small'
        onClick={onAddButtonClick}
        startIcon={<AddIcon />}
      >
        タグを追加
      </Button>
    </div>
  );
};

function scrollToCursor(optionsRef: React.RefObject<HTMLDivElement | null>, cursor: number): void {
  const container = optionsRef.current;
  if (!container) {
    return;
  }
  const element = container.children[cursor] as HTMLElement | undefined;
  if (element) {
    container.scrollTo({ top: element.offsetTop - 8 });
  }
}

const StyledComponent = styled(Component)`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .input-wrapper {
    position: relative;
  }

  input {
    ${({ width }) => (width ? `width: ${width}px;` : '')}
  }
`;

export default StyledComponent;
