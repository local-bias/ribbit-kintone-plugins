import { JotaiFieldSelect, useArray } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Skeleton, TextField, Tooltip } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { getNewFieldAction } from '@/lib/plugin';

const fieldActionsAtom = getConditionPropertyAtom('fieldActions');

function FieldActionFormComponent() {
  const fieldActions = useAtomValue(fieldActionsAtom);
  const { addItem, updateItem, deleteItem } = useArray(fieldActionsAtom);

  if (fieldActions.length === 0) {
    return (
      <Tooltip title='入力アクションを追加する'>
        <IconButton
          size='small'
          aria-label='入力アクションを追加'
          onClick={() => addItem({ index: 0, newItem: getNewFieldAction() })}
        >
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {fieldActions.map((action, i) => (
        <div key={action.id} className='flex items-start gap-2'>
          <JotaiFieldSelect
            fieldPropertiesAtom={currentAppFieldsAtom}
            fieldCode={action.fieldCode}
            label='対象フィールド'
            onChange={(code) => updateItem({ index: i, newItem: { ...action, fieldCode: code } })}
          />
          <TextField
            label='入力する値'
            value={action.value}
            multiline
            minRows={1}
            sx={{ minWidth: 240 }}
            helperText='TODAY / NOW（日付・日時・時刻）、LOGINUSER（ユーザー選択）、複数選択は改行区切り'
            onChange={(event) =>
              updateItem({ index: i, newItem: { ...action, value: event.target.value } })
            }
          />
          <div className='flex items-center gap-1 pt-2'>
            <Tooltip title='入力アクションを追加する'>
              <IconButton
                size='small'
                onClick={() => addItem({ index: i + 1, newItem: getNewFieldAction() })}
              >
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='この入力アクションを削除する'>
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

function FieldActionFormPlaceholder() {
  return (
    <div className='flex flex-col gap-4'>
      {new Array(2).fill('').map((_, i) => (
        <div key={i} className='flex items-center gap-2'>
          <Skeleton variant='rounded' width={240} height={56} />
          <Skeleton variant='rounded' width={240} height={56} />
        </div>
      ))}
    </div>
  );
}

export default function FieldActionForm() {
  return (
    <Suspense fallback={<FieldActionFormPlaceholder />}>
      <FieldActionFormComponent />
    </Suspense>
  );
}
