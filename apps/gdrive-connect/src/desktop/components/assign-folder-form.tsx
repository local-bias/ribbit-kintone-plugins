import styled from '@emotion/styled';
import { type FormEvent, useState } from 'react';
import { SecondaryButton } from './styles';

const Form = styled.form`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--gdc-border-strong, #d4d4d8);
  border-radius: var(--gdc-radius, 3px);
  font-size: 13px;
  color: var(--gdc-fg, #18181b);

  &:focus {
    outline: none;
    border-color: var(--gdc-accent, #1a73e8);
  }
`;

interface Props {
  disabled?: boolean;
  onAssign: (input: string) => void;
}

function AssignFolderForm({ disabled, onAssign }: Props) {
  const [value, setValue] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    onAssign(value);
  };

  return (
    <Form onSubmit={onSubmit}>
      <Input
        type='text'
        placeholder='既存フォルダのIDまたはURL'
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
      />
      <SecondaryButton type='submit' disabled={disabled || !value.trim()}>
        割り当てる
      </SecondaryButton>
    </Form>
  );
}

export default AssignFolderForm;
