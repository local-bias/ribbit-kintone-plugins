import { getConditionPropertyAtom } from '@/config/states/plugin';
import { TargetEvent } from '@/schema/plugin-config';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';

const OPTIONS: { value: TargetEvent; label: string }[] = [
  {
    value: 'create',
    label: 'レコード追加画面',
  },
  {
    value: 'edit',
    label: 'レコード編集画面',
  },
];

const targetEventsAtom = getConditionPropertyAtom('targetEvents');

export default function TargetEventsForm() {
  const value = useAtomValue(targetEventsAtom);

  const onChange = useAtomCallback(
    useCallback((_, set, targetValue: TargetEvent, checked: boolean) => {
      set(targetEventsAtom, (prev) => {
        if (checked) {
          return [...prev, targetValue];
        }
        return prev.filter((v) => v !== targetValue);
      });
    }, [])
  );

  return (
    <div>
      <FormGroup>
        {OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={value.includes(option.value)}
                onChange={(_, checked) => onChange(option.value, checked)}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
    </div>
  );
}
