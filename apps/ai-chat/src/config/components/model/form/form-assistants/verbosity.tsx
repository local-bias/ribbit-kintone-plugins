import { MenuItem, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { type ChangeEvent, FC } from 'react';
import { verbosityAtom } from '@/config/states/plugin';
import type { VerbosityType } from '@/schema/ai';

const VERBOSITY_OPTIONS = [
  { value: 'model-default', label: 'Model Default - モデルデフォルト' },
  { value: 'low', label: 'Low - 簡潔' },
  { value: 'medium', label: 'Medium - 標準' },
  { value: 'high', label: 'High - 詳細' },
] as const satisfies { value: VerbosityType; label: string }[];

const handleVerbosityChangeAtom = atom(null, (_, set, event: ChangeEvent<HTMLInputElement>) => {
  const value = event.target.value as VerbosityType;
  set(verbosityAtom, value);
});

export default function Verbosity() {
  const verbosity = useAtomValue(verbosityAtom);
  const onChange = useSetAtom(handleVerbosityChangeAtom);

  return (
    <TextField select label='詳細度' value={verbosity} onChange={onChange} sx={{ width: 300 }}>
      {VERBOSITY_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
