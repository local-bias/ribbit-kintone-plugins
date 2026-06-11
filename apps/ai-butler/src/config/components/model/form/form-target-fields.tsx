import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Skeleton, Tooltip } from '@mui/material';
import { useArrayAtom, useAtomValue, useSetAtom } from '@repo/jotai';
import { Suspense } from 'react';
import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';

const targetFieldCodesAtom = getConditionPropertyAtom('targetFieldCodes');

const { handleItemAddAtom, handleItemDeleteAtom, handleItemUpdateAtom } =
  useArrayAtom(targetFieldCodesAtom);

function TargetFieldsContent() {
  const fields = useAtomValue(targetFieldCodesAtom);
  const addItem = useSetAtom(handleItemAddAtom);
  const deleteItem = useSetAtom(handleItemDeleteAtom);
  const updateItem = useSetAtom(handleItemUpdateAtom);

  const isEmpty = fields.length === 0;

  return (
    <div className='flex flex-col gap-3'>
      {isEmpty ? (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-gray-500'>対象フィールドが未設定です</span>
          <Tooltip title='フィールドを追加する'>
            <IconButton size='small' onClick={() => addItem({ newItem: '' })}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </div>
      ) : (
        fields.map((value, i) => (
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
            <Tooltip title='このフィールドを削除する'>
              <IconButton size='small' onClick={() => deleteItem(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </div>
        ))
      )}
    </div>
  );
}

function TargetFieldsPlaceholder() {
  return (
    <div className='flex flex-col gap-4'>
      {new Array(2).fill('').map((_, i) => (
        <div key={i} className='flex items-center gap-2'>
          <Skeleton variant='rounded' width={400} height={56} />
          <Skeleton variant='circular' width={24} height={24} />
        </div>
      ))}
    </div>
  );
}

export default function TargetFieldsForm() {
  return (
    <Suspense fallback={<TargetFieldsPlaceholder />}>
      <TargetFieldsContent />
    </Suspense>
  );
}
