import React, { ChangeEventHandler, FC, FocusEventHandler, useRef, useState } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import {
  filteredOptionsState,
  inputValueState,
  optionCursorState,
} from '@/desktop/autocomplete/states';
import { KintoneInput } from '../../../components/ui/kintone-input';
import styled from '@emotion/styled';

const Input: FC<{
  inputRef: React.RefObject<HTMLInputElement>;
  onFocus: FocusEventHandler<HTMLInputElement>;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}> = ({ inputRef, onFocus, onKeyDown }) => {
  const value = useRecoilValue(inputValueState);

  const onValueChange: ChangeEventHandler<HTMLInputElement> = useRecoilCallback(
    ({ set }) =>
      (event) => {
        set(inputValueState, event.target.value);
      },
    []
  );

  return (
    <KintoneInput
      ref={inputRef}
      value={value}
      onChange={onValueChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    />
  );
};

const Options: FC<{
  className?: string;
  optionsRef: React.RefObject<HTMLDivElement>;
  open: boolean;
  handleSelectOption: (selectedOption: Plugin.AutocompleteOption) => void;
}> = ({ className, optionsRef, open, handleSelectOption }) => {
  const options = useRecoilValue(filteredOptionsState);
  const optionCursor = useRecoilValue(optionCursorState);

  if (!open) {
    return null;
  }

  return (
    <div className={className}>
      <div ref={optionsRef}>
        {options.length === 0 && <div className='not-found'>候補が見つかりませんでした</div>}
        {options.map((option, index) => (
          <div
            key={option.value}
            data-cursor={index === optionCursor ? '' : undefined}
            onClick={() => handleSelectOption(option)}
            onMouseDown={(event) => event.preventDefault()}
          >
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const StyledOptions = styled(Options)`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  z-index: 50;
  padding: 8px 0;
  font-size: 14px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    min-width: 300px;
  }

  > div {
    overflow-y: hidden;
    padding-left: 8px;
    padding-right: 8px;
    max-height: 400px;
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
        background-color: #f5f5f5;
      }
    }
  }
`;

export function Autocomplete() {
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const onFocus = () => setOpen(true);
  const onBlur: FocusEventHandler<HTMLInputElement> = useRecoilCallback(
    ({ reset, set }) =>
      (event) => {
        setTimeout(() => {
          setOpen(false);
          reset(optionCursorState);
        }, 0);
      },
    []
  );

  const handleSelectOption = useRecoilCallback(
    ({ set }) =>
      (selectedOption: Plugin.AutocompleteOption) => {
        set(inputValueState, selectedOption.label);
        setTimeout(() => {
          inputRef?.current?.blur();
        }, 0);
      },
    []
  );

  const onKeyDown = useRecoilCallback(
    ({ set, snapshot }) =>
      async (event: React.KeyboardEvent<HTMLInputElement>) => {
        const options = await snapshot.getPromise(filteredOptionsState);
        if (
          (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter') ||
          options.length === 0
        ) {
          return;
        }
        event.preventDefault();
        let optionCursor = await snapshot.getPromise(optionCursorState);
        if (event.key === 'ArrowDown') {
          optionCursor = Math.min(optionCursor + 1, options.length - 1);
        } else if (event.key === 'ArrowUp') {
          optionCursor = Math.max(optionCursor - 1, -1);
        } else if (event.key === 'Enter') {
          const selectedOption = options[optionCursor];
          if (selectedOption) {
            handleSelectOption(selectedOption);
          }
          return;
        }
        set(optionCursorState, optionCursor);
        if (optionCursor === -1) {
          return;
        }
        optionsRef.current?.scrollTo({
          top: (optionsRef.current?.children[optionCursor] as HTMLElement)?.offsetTop,
        });
      },
    []
  );

  return (
    <div className='relative' onBlur={onBlur}>
      <Input inputRef={inputRef} onFocus={onFocus} onKeyDown={onKeyDown} />
      <StyledOptions optionsRef={optionsRef} open={open} handleSelectOption={handleSelectOption} />
    </div>
  );
}
