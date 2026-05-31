import { bindingsAtom } from '@/config/states/plugin';
import { isValidCalcExpression } from '@/lib/calc-parser';
import { t } from '@/lib/i18n';
import { getNewBinding } from '@/lib/plugin';
import { Binding, BindingType } from '@/schema/plugin-config';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { EmbeddableInput as PrimitiveEmbeddableInput } from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { produce } from 'immer';
import { useAtomValue, useSetAtom } from 'jotai';
import { ArrowRightIcon, Link2Icon } from 'lucide-react';
import { FC, Suspense, useState } from 'react';
import {
  bindableAppFieldsAtom,
  currentAppDateFieldsAtom,
  currentAppNumberFieldsAtom,
  dstAppFieldsState,
} from '../../../states/kintone';

const BINDING_TYPE_OPTIONS: { value: BindingType; label: () => string }[] = [
  { value: 'field', label: () => t('config.condition.bindings.type.field') },
  { value: 'fixed', label: () => t('config.condition.bindings.type.fixed') },
  { value: 'concat', label: () => t('config.condition.bindings.type.concat') },
  { value: 'calc', label: () => t('config.condition.bindings.type.calc') },
  { value: 'date_offset', label: () => t('config.condition.bindings.type.date_offset') },
];

const EmbeddableInput: FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const fields = useAtomValue(bindableAppFieldsAtom);
  return <PrimitiveEmbeddableInput value={value} onChange={onChange} fieldProperties={fields} />;
};

const NumberEmbeddableInput: FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const fields = useAtomValue(currentAppNumberFieldsAtom);
  return <PrimitiveEmbeddableInput value={value} onChange={onChange} fieldProperties={fields} />;
};

const BindingTypeSelect: FC<{
  value: BindingType;
  onChange: (value: BindingType) => void;
}> = ({ value, onChange }) => (
  <FormControl sx={{ minWidth: 160 }}>
    <InputLabel>{t('config.condition.bindings.type.label')}</InputLabel>
    <Select
      value={value}
      label={t('config.condition.bindings.type.label')}
      onChange={(e) => onChange(e.target.value as BindingType)}
    >
      {BINDING_TYPE_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label()}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

type BindingInputProps = {
  binding: Binding;
  index: number;
  setBindings: (bindings: Binding[]) => void;
  bindings: Binding[];
};

/** type='field': ソースフィールド → デストフィールド */
const FieldBindingInputs: FC<BindingInputProps> = ({ binding, index, setBindings, bindings }) => (
  <div className='flex items-center gap-4 flex-1'>
    <JotaiFieldSelect
      label={t('config.condition.bindings.src.label')}
      fieldPropertiesAtom={bindableAppFieldsAtom}
      onChange={(value) =>
        setBindings(
          produce(bindings, (draft) => {
            draft[index]!.srcFieldCode = value;
          })
        )
      }
      fieldCode={binding.srcFieldCode ?? ''}
    />
    <Link2Icon className='flex-shrink-0' />
    <JotaiFieldSelect
      label={t('config.condition.bindings.dst.label')}
      fieldPropertiesAtom={dstAppFieldsState}
      onChange={(value) =>
        setBindings(
          produce(bindings, (draft) => {
            draft[index]!.dstFieldCode = value;
          })
        )
      }
      fieldCode={binding.dstFieldCode}
    />
  </div>
);

/** type='fixed': 固定値入力 → デストフィールド */
const FixedBindingInputs: FC<BindingInputProps> = ({ binding, index, setBindings, bindings }) => (
  <div className='flex items-center gap-4 flex-1'>
    <TextField
      label={t('config.condition.bindings.fixed.label')}
      placeholder={t('config.condition.bindings.fixed.placeholder')}
      value={binding.fixedValue ?? ''}
      onChange={(e) =>
        setBindings(
          produce(bindings, (draft) => {
            draft[index]!.fixedValue = e.target.value;
          })
        )
      }
      sx={{ minWidth: 200, flex: 1 }}
    />
    <ArrowRightIcon className='flex-shrink-0' />
    <JotaiFieldSelect
      label={t('config.condition.bindings.dst.label')}
      fieldPropertiesAtom={dstAppFieldsState}
      onChange={(value) =>
        setBindings(
          produce(bindings, (draft) => {
            draft[index]!.dstFieldCode = value;
          })
        )
      }
      fieldCode={binding.dstFieldCode}
    />
  </div>
);

/** type='concat': 文字列結合式 (EmbeddableInput) → デストフィールド */
const ConcatBindingInputs: FC<BindingInputProps> = ({ binding, index, setBindings, bindings }) => (
  <div className='flex flex-col gap-1'>
    <div className='flex items-center gap-4'>
      <div className='flex-1'>
        <EmbeddableInput
          value={binding.concatExpression ?? ''}
          onChange={(value) =>
            setBindings(
              produce(bindings, (draft) => {
                draft[index]!.concatExpression = value;
              })
            )
          }
        />
      </div>
      <ArrowRightIcon className='flex-shrink-0' />
      <JotaiFieldSelect
        label={t('config.condition.bindings.dst.label')}
        fieldPropertiesAtom={dstAppFieldsState}
        onChange={(value) =>
          setBindings(
            produce(bindings, (draft) => {
              draft[index]!.dstFieldCode = value;
            })
          )
        }
        fieldCode={binding.dstFieldCode}
      />
    </div>
    <Typography variant='caption' sx={{ color: 'text.secondary', pl: 1 }}>
      {t('config.condition.bindings.concat.hint')}
    </Typography>
  </div>
);

/** type='calc': 計算式 (EmbeddableInput) → デストフィールド（入力時に検証） */
const CalcBindingInputs: FC<BindingInputProps> = ({ binding, index, setBindings, bindings }) => {
  const [isValid, setIsValid] = useState(() => isValidCalcExpression(binding.calcExpression ?? ''));

  const handleChange = (value: string) => {
    setIsValid(isValidCalcExpression(value));
    setBindings(
      produce(bindings, (draft) => {
        draft[index]!.calcExpression = value;
      })
    );
  };

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-4'>
        <div className='flex-1'>
          <NumberEmbeddableInput value={binding.calcExpression ?? ''} onChange={handleChange} />
          {!isValid && (
            <Typography variant='caption' color='error' sx={{ pl: 1, display: 'block' }}>
              {t('config.condition.bindings.calc.invalidExpression')}
            </Typography>
          )}
        </div>
        <ArrowRightIcon className='flex-shrink-0' />
        <JotaiFieldSelect
          label={t('config.condition.bindings.dst.label')}
          fieldPropertiesAtom={dstAppFieldsState}
          onChange={(value) =>
            setBindings(
              produce(bindings, (draft) => {
                draft[index]!.dstFieldCode = value;
              })
            )
          }
          fieldCode={binding.dstFieldCode}
        />
      </div>
      <Typography variant='caption' sx={{ color: 'text.secondary', pl: 1 }}>
        {t('config.condition.bindings.calc.hint')}
      </Typography>
    </div>
  );
};

/** type='date_offset': 日付フィールド + オフセット量・単位 → デストフィールド */
const DateOffsetBindingInputs: FC<BindingInputProps> = ({
  binding,
  index,
  setBindings,
  bindings,
}) => {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-4'>
        <JotaiFieldSelect
          label={t('config.condition.bindings.date_offset.srcField')}
          fieldPropertiesAtom={currentAppDateFieldsAtom}
          onChange={(value) =>
            setBindings(
              produce(bindings, (draft) => {
                draft[index]!.dateOffsetSrcFieldCode = value;
              })
            )
          }
          fieldCode={binding.dateOffsetSrcFieldCode ?? ''}
        />
        <TextField
          label={t('config.condition.bindings.date_offset.offsetValue')}
          type='number'
          value={binding.dateOffsetValue ?? 0}
          onChange={(e) =>
            setBindings(
              produce(bindings, (draft) => {
                draft[index]!.dateOffsetValue = Number(e.target.value);
              })
            )
          }
          sx={{ width: 100 }}
          slotProps={{ htmlInput: { step: 1 } }}
        />
        <FormControl sx={{ minWidth: 100 }}>
          <InputLabel>{t('config.condition.bindings.date_offset.offsetUnit')}</InputLabel>
          <Select
            value={binding.dateOffsetUnit ?? 'day'}
            label={t('config.condition.bindings.date_offset.offsetUnit')}
            onChange={(e) =>
              setBindings(
                produce(bindings, (draft) => {
                  draft[index]!.dateOffsetUnit = e.target.value as 'day' | 'month' | 'year';
                })
              )
            }
          >
            <MenuItem value='day'>{t('config.condition.bindings.date_offset.unit.day')}</MenuItem>
            <MenuItem value='month'>
              {t('config.condition.bindings.date_offset.unit.month')}
            </MenuItem>
            <MenuItem value='year'>{t('config.condition.bindings.date_offset.unit.year')}</MenuItem>
          </Select>
        </FormControl>
        <ArrowRightIcon className='flex-shrink-0' />
        <JotaiFieldSelect
          label={t('config.condition.bindings.dst.label')}
          fieldPropertiesAtom={dstAppFieldsState}
          onChange={(value) =>
            setBindings(
              produce(bindings, (draft) => {
                draft[index]!.dstFieldCode = value;
              })
            )
          }
          fieldCode={binding.dstFieldCode}
        />
      </div>
      <Typography variant='caption' sx={{ color: 'text.secondary', pl: 1 }}>
        {t('config.condition.bindings.date_offset.hint')}
      </Typography>
    </div>
  );
};

const Rows: FC = () => {
  const bindings = useAtomValue(bindingsAtom);
  const setBindings = useSetAtom(bindingsAtom);

  const onTypeChange = (index: number, newType: BindingType) => {
    setBindings(
      produce(bindings, (draft) => {
        const existing = draft[index];
        if (!existing) return;
        const base = { id: existing.id, dstFieldCode: existing.dstFieldCode };
        switch (newType) {
          case 'field':
            draft[index] = { ...base, type: 'field', srcFieldCode: '' };
            break;
          case 'fixed':
            draft[index] = { ...base, type: 'fixed', fixedValue: '' };
            break;
          case 'concat':
            draft[index] = { ...base, type: 'concat', concatExpression: '' };
            break;
          case 'calc':
            draft[index] = { ...base, type: 'calc', calcExpression: '' };
            break;
          case 'date_offset':
            draft[index] = {
              ...base,
              type: 'date_offset',
              dateOffsetSrcFieldCode: '',
              dateOffsetValue: 0,
              dateOffsetUnit: 'day',
            };
            break;
        }
      })
    );
  };

  const addItem = (index: number) => {
    const next = [...bindings];
    next.splice(index + 1, 0, getNewBinding());
    setBindings(next);
  };

  const deleteItem = (index: number) => {
    setBindings(bindings.filter((_, i) => i !== index));
  };

  return (
    <div className='grid gap-4'>
      {bindings.map((binding, index) => {
        const bindingType: BindingType = binding.type ?? 'field';
        const inputProps: BindingInputProps = { binding, index, setBindings, bindings };

        return (
          <div key={binding.id} className='flex items-start gap-4'>
            <BindingTypeSelect
              value={bindingType}
              onChange={(value) => onTypeChange(index, value)}
            />
            {bindingType === 'field' && <FieldBindingInputs {...inputProps} />}
            {bindingType === 'fixed' && <FixedBindingInputs {...inputProps} />}
            {bindingType === 'concat' && <ConcatBindingInputs {...inputProps} />}
            {bindingType === 'calc' && <CalcBindingInputs {...inputProps} />}
            {bindingType === 'date_offset' && <DateOffsetBindingInputs {...inputProps} />}
            <div className='flex items-center gap-1 flex-shrink-0 pt-1'>
              <Tooltip title={t('config.condition.bindings.add')}>
                <IconButton size='small' onClick={() => addItem(index)}>
                  <AddIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              {bindings.length > 1 && (
                <Tooltip title={t('config.condition.bindings.delete')}>
                  <IconButton size='small' onClick={() => deleteItem(index)}>
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Container: FC = () => {
  return (
    <Suspense fallback={<Skeleton variant='rectangular' width={600} height={200} />}>
      <Rows />
    </Suspense>
  );
};

export default Container;
