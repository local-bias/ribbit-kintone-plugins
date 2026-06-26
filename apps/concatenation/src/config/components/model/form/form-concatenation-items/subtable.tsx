import { MenuItem, TextField } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { useAtomCallback } from '@repo/jotai/utils';
import { produce } from 'immer';
import { type FC, Suspense, useCallback } from 'react';
import { subtableFieldsAtom } from '@/config/states/kintone';
import { concatenationItemsState } from '@/config/states/plugin';
import { FORMATTABLE_FIELD_TYPES } from '@/lib/plugin';

type ContainerProps = { item: Plugin.Condition['concatenationItems'][number]; index: number };
type Props = { item: Plugin.ConcatenationItem.Subtable; index: number };

const Component: FC<Props> = ({ item, index }) => {
  const subtables = useAtomValue(subtableFieldsAtom);
  const selectedTable = subtables.find((table) => table.code === item.value);
  const columns = selectedTable ? Object.values(selectedTable.fields) : [];
  const selectedColumn = columns.find((column) => column.code === item.columnField);

  const onTableChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: string) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            const target = draft[index];
            if (target?.type !== 'subtable') {
              return;
            }
            target.value = value;
            // テーブルを変更したら、列の選択状態をリセットする
            target.columnField = '';
          })
        ),
      []
    )
  );

  const onColumnChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: string) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            const target = draft[index];
            if (target?.type !== 'subtable') {
              return;
            }
            target.columnField = value;
          })
        ),
      []
    )
  );

  const onSeparatorChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: string) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            const target = draft[index];
            if (target?.type !== 'subtable') {
              return;
            }
            target.separator = value;
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
            const target = draft[index];
            if (target?.type !== 'subtable') {
              return;
            }
            target.format = value;
          })
        ),
      []
    )
  );

  return (
    <>
      <div className='col-span-4'>
        <TextField
          label='テーブル'
          select
          fullWidth
          value={item.value}
          onChange={(e) => onTableChange(index, e.target.value)}
        >
          {subtables.length === 0 && (
            <MenuItem value='' disabled>
              テーブルが存在しません
            </MenuItem>
          )}
          {subtables.map((table) => (
            <MenuItem key={table.code} value={table.code}>
              {table.label}
            </MenuItem>
          ))}
        </TextField>
      </div>
      <div className='col-span-3'>
        <TextField
          label='連結する列'
          select
          fullWidth
          disabled={!selectedTable}
          value={item.columnField}
          onChange={(e) => onColumnChange(index, e.target.value)}
        >
          {columns.map((column) => (
            <MenuItem key={column.code} value={column.code}>
              {column.label}
            </MenuItem>
          ))}
        </TextField>
      </div>
      <div className='col-span-3'>
        <TextField
          label='区切り文字'
          fullWidth
          multiline
          minRows={1}
          value={item.separator}
          placeholder='改行 / 、 など'
          helperText='各行の値をこの文字で連結します(改行も入力可)'
          onChange={(e) => onSeparatorChange(index, e.target.value)}
        />
      </div>
      {FORMATTABLE_FIELD_TYPES.includes(selectedColumn?.type as any) && (
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
  if (props.item.type !== 'subtable') {
    return null;
  }
  return (
    <Suspense>
      <Component {...(props as Props)} />
    </Suspense>
  );
};

export default Container;
