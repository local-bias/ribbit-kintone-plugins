import { getConditionPropertyAtom } from '@/config/states/plugin';
import { PluginCondition } from '@/schema/plugin-config';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { FC, useCallback } from 'react';

type OptionValue = PluginCondition['targetEvents'][number];

const OPTIONS: { value: OptionValue; label: string }[] = [
  {
    value: 'create',
    label: 'レコード追加画面',
  },
  {
    value: 'edit',
    label: 'レコード編集画面',
  },
  {
    value: 'detail',
    label: 'レコード詳細画面',
  },
  {
    value: 'index',
    label: '一覧画面',
  },
];

const state = getConditionPropertyAtom('targetEvents');

const Component: FC = () => {
  const value = useAtomValue(state);

  const onChange = useAtomCallback(
    useCallback((_, set, value: OptionValue, checked: boolean) => {
      set(state, (prev) => {
        if (checked) {
          return [...prev, value];
        }
        return prev.filter((v) => v !== value);
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
};

export default Component;
