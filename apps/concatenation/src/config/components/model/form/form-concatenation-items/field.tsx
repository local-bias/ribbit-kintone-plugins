import { currentAppFormFieldsAtom } from '@/config/states/kintone';
import { concatenationItemsState } from '@/config/states/plugin';
import { FORMATTABLE_FIELD_TYPES } from '@/lib/plugin';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { TextField } from '@mui/material';
import { produce } from 'immer';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { FC, Suspense, useCallback } from 'react';

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
            //@ts-ignore
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
            //@ts-ignore
            draft[index].format = value;
          })
        ),
      []
    )
  );

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
