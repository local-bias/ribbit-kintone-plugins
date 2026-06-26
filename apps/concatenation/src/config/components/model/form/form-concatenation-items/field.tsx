import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { FormControlLabel, Switch, TextField } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { useAtomCallback } from '@repo/jotai/utils';
import { produce } from 'immer';
import { type FC, Suspense, useCallback } from 'react';
import { currentAppFormFieldsAtom } from '@/config/states/kintone';
import { concatenationItemsState } from '@/config/states/plugin';
import { FORMATTABLE_FIELD_TYPES, NUMBER_FORMATTABLE_FIELD_TYPES } from '@/lib/plugin';

type ContainerProps = { item: Plugin.Condition['concatenationItems'][number]; index: number };
type Props = { item: Plugin.ConcatenationItem.Field; index: number };

const Component: FC<Props> = ({ item, index }) => {
  const appFields = useAtomValue(currentAppFormFieldsAtom);

  const field = appFields.find((field) => field.code === item.value);

  const onFieldChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: string) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            //@ts-expect-error
            draft[index].value = value;
          })
        ),
      []
    )
  );

  const onFormatChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: string) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            //@ts-expect-error
            draft[index].format = value;
          })
        ),
      []
    )
  );

  const onNumberFormatChange = useAtomCallback(
    useCallback(
      (_, set, index: number, patch: Partial<Plugin.ConcatenationItem.NumberFormat>) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            const target = draft[index];
            if (target?.type !== 'field') {
              return;
            }
            target.numberFormat = { ...target.numberFormat, ...patch };
          })
        ),
      []
    )
  );

  const numberFormat = item.numberFormat ?? {};

  return (
    <>
      <div className='col-span-4'>
        <JotaiFieldSelect
          label='フィールド'
          fieldPropertiesAtom={currentAppFormFieldsAtom}
          fieldCode={item.value}
          sx={{ width: undefined }}
          fullWidth
          onChange={(code) => onFieldChange(index, code)}
        />
      </div>
      {FORMATTABLE_FIELD_TYPES.includes(field?.type as any) && (
        <div className='col-span-4'>
          <TextField
            label='フォーマット'
            fullWidth
            value={item.format}
            placeholder='yyyy-MM-dd'
            onChange={(e) => onFormatChange(index, e.target.value)}
          />
        </div>
      )}
      {NUMBER_FORMATTABLE_FIELD_TYPES.includes(field?.type as any) && (
        <>
          <div className='col-span-10'>
            <FormControlLabel
              control={
                <Switch
                  checked={numberFormat.useGrouping ?? false}
                  onChange={(_, checked) => onNumberFormatChange(index, { useGrouping: checked })}
                />
              }
              label='3桁ごとに桁区切り(,)を付ける'
            />
          </div>
          <div className='col-span-3'>
            <TextField
              type='number'
              label='小数桁数'
              fullWidth
              value={numberFormat.decimalDigits ?? ''}
              placeholder='指定なし'
              helperText='空欄で元の値のまま'
              slotProps={{ htmlInput: { min: 0, max: 20 } }}
              onChange={(e) =>
                onNumberFormatChange(index, {
                  decimalDigits: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </div>
          <div className='col-span-3'>
            <TextField
              label='接頭辞'
              fullWidth
              value={numberFormat.prefix ?? ''}
              placeholder='¥ など'
              onChange={(e) => onNumberFormatChange(index, { prefix: e.target.value })}
            />
          </div>
          <div className='col-span-3'>
            <TextField
              label='接尾辞'
              fullWidth
              value={numberFormat.suffix ?? ''}
              placeholder='円 など'
              onChange={(e) => onNumberFormatChange(index, { suffix: e.target.value })}
            />
          </div>
        </>
      )}
    </>
  );
};

const Container: FC<ContainerProps> = (props) => {
  if (props.item.type !== 'field') {
    return null;
  }
  return (
    <Suspense>
      <Component {...(props as Props)} />
    </Suspense>
  );
};

export default Container;
