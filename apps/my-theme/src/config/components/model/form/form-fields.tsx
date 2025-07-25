import { getConditionPropertyAtom } from '@/config/states/plugin';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Skeleton, Tooltip } from '@mui/material';
import { useArrayAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';
import { currentAppFieldsAtom } from '../../../states/kintone';

const fieldsAtom = getConditionPropertyAtom('fields');

const { handleItemAddAtom, handleItemDeleteAtom, handleItemUpdateAtom } = useArrayAtom(fieldsAtom);

function KintoneFormFieldSelectComponent() {
  const fields = useAtomValue(fieldsAtom);
  const addItem = useSetAtom(handleItemAddAtom);
  const deleteItem = useSetAtom(handleItemDeleteAtom);
  const updateItem = useSetAtom(handleItemUpdateAtom);

  return (
    <div className='flex flex-col gap-4'>
      {fields.map((value, i) => (
        <div key={i} className='flex items-center gap-2'>
          <JotaiFieldSelect
            fieldPropertiesAtom={currentAppFieldsAtom}
            onChange={(code) => updateItem({ index: i, newItem: code })}
            fieldCode={value}
          />
          <Tooltip title='フィールドを追加する'>
            <IconButton size='small' onClick={() => addItem({ newItem: '', index: i + 1 })}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {fields.length > 1 && (
            <Tooltip title='このフィールドを削除する'>
              <IconButton size='small' onClick={() => deleteItem(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ))}
    </div>
  );
}

function KintoneFormFieldSelectPlaceholder() {
  return (
    <div className='flex flex-col gap-4'>
      {new Array(3).fill('').map((_, i) => (
        <div key={i} className='flex items-center gap-2'>
          <Skeleton variant='rounded' width={400} height={56} />
          <Skeleton variant='circular' width={24} height={24} />
          <Skeleton variant='circular' width={24} height={24} />
        </div>
      ))}
    </div>
  );
}

export default function KintoneFormFieldSelect() {
  return (
    <Suspense fallback={<KintoneFormFieldSelectPlaceholder />}>
      <KintoneFormFieldSelectComponent />
    </Suspense>
  );
}
