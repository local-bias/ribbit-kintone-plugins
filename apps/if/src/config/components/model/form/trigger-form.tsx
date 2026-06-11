import { useArray } from '@konomi-app/kintone-utilities-jotai';
import { FieldConditionInput } from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Skeleton,
  TextField,
  Tooltip,
} from '@mui/material';
import { useAtom, useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { getNewFieldCondition } from '@/lib/plugin';
import type { ConditionLogic, TargetEvent, TriggerTiming } from '@/schema/plugin-config';

const targetEventsAtom = getConditionPropertyAtom('targetEvents');
const triggerTimingsAtom = getConditionPropertyAtom('triggerTimings');
const conditionLogicAtom = getConditionPropertyAtom('conditionLogic');
const conditionsAtom = getConditionPropertyAtom('conditions');

const TARGET_EVENT_OPTIONS: { value: TargetEvent; label: string }[] = [
  { value: 'create', label: 'レコード追加画面' },
  { value: 'edit', label: 'レコード編集画面' },
];

const TRIGGER_TIMING_OPTIONS: { value: TriggerTiming; label: string }[] = [
  { value: 'submit', label: 'レコード保存時' },
  { value: 'change', label: 'フィールド変更時' },
  { value: 'show', label: '画面表示時' },
];

export function TargetEventForm() {
  const [targetEvents, setTargetEvents] = useAtom(targetEventsAtom);

  const toggle = (value: TargetEvent) => {
    setTargetEvents((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <FormGroup row>
      {TARGET_EVENT_OPTIONS.map((option) => (
        <FormControlLabel
          key={option.value}
          control={
            <Checkbox
              checked={targetEvents.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
          }
          label={option.label}
        />
      ))}
    </FormGroup>
  );
}

export function TriggerTimingForm() {
  const [triggerTimings, setTriggerTimings] = useAtom(triggerTimingsAtom);

  const toggle = (value: TriggerTiming) => {
    setTriggerTimings((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  return (
    <FormGroup row>
      {TRIGGER_TIMING_OPTIONS.map((option) => (
        <FormControlLabel
          key={option.value}
          control={
            <Checkbox
              checked={triggerTimings.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
          }
          label={option.label}
        />
      ))}
    </FormGroup>
  );
}

export function ConditionLogicForm() {
  const [logic, setLogic] = useAtom(conditionLogicAtom);

  return (
    <TextField
      select
      label='条件の結合方法'
      value={logic}
      sx={{ width: 280 }}
      onChange={(event) => setLogic(event.target.value as ConditionLogic)}
    >
      <MenuItem value='and'>すべての条件を満たす（AND）</MenuItem>
      <MenuItem value='or'>いずれかの条件を満たす（OR）</MenuItem>
    </TextField>
  );
}

function ConditionsFormComponent() {
  const fields = useAtomValue(currentAppFieldsAtom);
  const conditions = useAtomValue(conditionsAtom);
  const { addItem, updateItem, deleteItem } = useArray(conditionsAtom);

  if (conditions.length === 0) {
    return (
      <Tooltip title='条件を追加する'>
        <IconButton
          size='small'
          aria-label='条件を追加'
          onClick={() => addItem({ index: 0, newItem: getNewFieldCondition() })}
        >
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {conditions.map((condition, i) => (
        <div key={i} className='flex flex-wrap items-start gap-3'>
          <FieldConditionInput
            fields={fields}
            value={condition}
            lang='ja'
            onChange={(newCondition) => updateItem({ index: i, newItem: newCondition })}
          />
          <div className='flex items-center gap-1 pt-1'>
            <Tooltip title='条件を追加する'>
              <IconButton
                size='small'
                onClick={() => addItem({ index: i + 1, newItem: getNewFieldCondition() })}
              >
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='この条件を削除する'>
              <IconButton size='small' onClick={() => deleteItem(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConditionsForm() {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={480} height={56} />}>
      <ConditionsFormComponent />
    </Suspense>
  );
}
