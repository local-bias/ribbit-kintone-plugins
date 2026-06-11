import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { useArray } from '@konomi-app/kintone-utilities-jotai';
import { FieldConditionInput } from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { currentAppSubtableFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { getNewRowAction } from '@/lib/plugin';
import type { RowAction, RowActionType, RowCellValue } from '@/schema/plugin-config';

const rowActionsAtom = getConditionPropertyAtom('rowActions');

const ROW_ACTION_TYPE_OPTIONS: { value: RowActionType; label: string }[] = [
  { value: 'add', label: '行を追加する' },
  { value: 'exclude', label: '行を削除する' },
];

/** サブテーブルの内部フィールド一覧を取得します */
const getInnerFields = (
  subtables: kintoneAPI.FieldProperty[],
  subtableCode: string
): kintoneAPI.FieldProperty[] => {
  const subtable = subtables.find((field) => field.code === subtableCode);
  if (!subtable || subtable.type !== 'SUBTABLE') {
    return [];
  }
  return Object.values((subtable as { fields: Record<string, kintoneAPI.FieldProperty> }).fields);
};

type CellValuesEditorProps = {
  action: RowAction;
  innerFields: kintoneAPI.FieldProperty[];
  onChange: (cellValues: RowCellValue[]) => void;
};

function CellValuesEditor({ action, innerFields, onChange }: CellValuesEditorProps) {
  const addCell = () => onChange([...action.cellValues, { fieldCode: '', value: '' }]);
  const updateCell = (index: number, newCell: RowCellValue) =>
    onChange(action.cellValues.map((cell, i) => (i === index ? newCell : cell)));
  const deleteCell = (index: number) => onChange(action.cellValues.filter((_, i) => i !== index));

  return (
    <div className='flex flex-col gap-2'>
      <span className='text-sm text-gray-500'>追加する行のセル値</span>
      {action.cellValues.map((cell, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: セル値の並びは安定しているため index を許容する
        <div key={index} className='flex items-start gap-2'>
          <TextField
            select
            label='フィールド'
            value={cell.fieldCode}
            sx={{ minWidth: 200 }}
            onChange={(event) => updateCell(index, { ...cell, fieldCode: event.target.value })}
          >
            {innerFields.map((field) => (
              <MenuItem key={field.code} value={field.code}>
                {field.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label='値'
            value={cell.value}
            sx={{ minWidth: 200 }}
            onChange={(event) => updateCell(index, { ...cell, value: event.target.value })}
          />
          <Tooltip title='このセル値を削除する'>
            <IconButton size='small' className='!mt-2' onClick={() => deleteCell(index)}>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </div>
      ))}
      <div>
        <Tooltip title='セル値を追加する'>
          <IconButton size='small' onClick={addCell}>
            <AddIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}

function RowActionFormComponent() {
  const subtables = useAtomValue(currentAppSubtableFieldsAtom);
  const rowActions = useAtomValue(rowActionsAtom);
  const { addItem, updateItem, deleteItem } = useArray(rowActionsAtom);

  if (rowActions.length === 0) {
    return (
      <Tooltip title='テーブルアクションを追加する'>
        <IconButton
          size='small'
          aria-label='テーブルアクションを追加'
          onClick={() => addItem({ index: 0, newItem: getNewRowAction() })}
        >
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {rowActions.map((action, i) => {
        const innerFields = getInnerFields(subtables, action.subtableCode);
        return (
          <Paper key={action.id} variant='outlined' className='flex flex-col gap-3 !p-4'>
            <div className='flex items-center gap-2'>
              <TextField
                select
                label='アクション'
                value={action.type}
                sx={{ width: 180 }}
                onChange={(event) =>
                  updateItem({
                    index: i,
                    newItem: { ...action, type: event.target.value as RowActionType },
                  })
                }
              >
                {ROW_ACTION_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label='対象テーブル'
                value={action.subtableCode}
                sx={{ minWidth: 220 }}
                onChange={(event) =>
                  updateItem({
                    index: i,
                    newItem: { ...action, subtableCode: event.target.value },
                  })
                }
              >
                {subtables.map((field) => (
                  <MenuItem key={field.code} value={field.code}>
                    {field.label}
                  </MenuItem>
                ))}
              </TextField>
              <div className='ml-auto'>
                <Tooltip title='このテーブルアクションを削除する'>
                  <IconButton size='small' onClick={() => deleteItem(i)}>
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            {action.type === 'add' && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={action.overwrite}
                      onChange={(event) =>
                        updateItem({
                          index: i,
                          newItem: { ...action, overwrite: event.target.checked },
                        })
                      }
                    />
                  }
                  label='既存の行をすべて置き換える'
                />
                <CellValuesEditor
                  action={action}
                  innerFields={innerFields}
                  onChange={(cellValues) =>
                    updateItem({ index: i, newItem: { ...action, cellValues } })
                  }
                />
              </>
            )}

            {action.type === 'exclude' && (
              <div className='flex flex-col gap-2'>
                <span className='text-sm text-gray-500'>削除対象の行の条件</span>
                <FieldConditionInput
                  fields={innerFields}
                  value={action.rowCondition}
                  lang='ja'
                  onChange={(rowCondition) =>
                    updateItem({ index: i, newItem: { ...action, rowCondition } })
                  }
                />
              </div>
            )}

            <div>
              <Tooltip title='テーブルアクションを追加する'>
                <IconButton
                  size='small'
                  onClick={() => addItem({ index: i + 1, newItem: getNewRowAction() })}
                >
                  <AddIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </div>
          </Paper>
        );
      })}
    </div>
  );
}

function RowActionFormPlaceholder() {
  return <Skeleton variant='rounded' width={520} height={120} />;
}

export default function RowActionForm() {
  return (
    <Suspense fallback={<RowActionFormPlaceholder />}>
      <RowActionFormComponent />
    </Suspense>
  );
}
