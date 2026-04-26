import {
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Skeleton,
  TextField,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { appSpacesState } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import type { ExecutionTiming } from '@/schema/plugin-config';

const executionTimingAtom = getConditionPropertyAtom('executionTiming');
const spaceFieldIdAtom = getConditionPropertyAtom('spaceFieldId');

const OPTIONS: { value: ExecutionTiming; label: string }[] = [
  { value: 'manual', label: 'ヘッダースペースに設置したボタン押下時' },
  { value: 'space_field', label: 'スペースフィールドに設置したボタン押下時' },
  { value: 'on_save', label: 'レコード保存時に自動実行' },
];

function SpaceFieldSelect() {
  const spaces = useAtomValue(appSpacesState);
  const [spaceFieldId, setSpaceFieldId] = useAtom(spaceFieldIdAtom);

  return (
    <TextField
      select
      value={spaceFieldId}
      onChange={(e) => setSpaceFieldId(e.target.value)}
      label='スペースフィールド'
      variant='outlined'
      sx={{ width: '300px', marginTop: '8px' }}
    >
      {spaces.map((space) => (
        <MenuItem key={space.elementId} value={space.elementId}>
          {space.elementId}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function ExecutionTimingForm() {
  const [timing, setTiming] = useAtom(executionTimingAtom);

  return (
    <FormControl>
      <RadioGroup value={timing} onChange={(e) => setTiming(e.target.value as ExecutionTiming)}>
        {OPTIONS.map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            control={<Radio />}
            label={opt.label}
          />
        ))}
      </RadioGroup>
      {timing === 'space_field' && (
        <Suspense fallback={<Skeleton variant='rounded' width={300} height={56} />}>
          <SpaceFieldSelect />
        </Suspense>
      )}
    </FormControl>
  );
}
