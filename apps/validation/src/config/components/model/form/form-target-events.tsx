import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { useAtomCallback } from '@repo/jotai/utils';
import { useCallback } from 'react';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import type { TargetEvent } from '@/schema/plugin-config';

const OPTIONS: { value: TargetEvent; labelKey: 'create' | 'edit' }[] = [
  { value: 'create', labelKey: 'create' },
  { value: 'edit', labelKey: 'edit' },
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
            label={t(`config.condition.targetEvents.${option.labelKey}`)}
          />
        ))}
      </FormGroup>
    </div>
  );
}
