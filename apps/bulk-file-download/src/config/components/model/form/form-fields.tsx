import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Skeleton, Tooltip } from '@mui/material';
import { useArrayAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';
import { fileFieldPropertiesAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';

const fieldCodesAtom = getConditionPropertyAtom('fieldCodes');

const { handleItemAddAtom, handleItemDeleteAtom, handleItemUpdateAtom } =
  useArrayAtom(fieldCodesAtom);

function FieldCodesFormComponent() {
  const fieldCodes = useAtomValue(fieldCodesAtom);
  const addItem = useSetAtom(handleItemAddAtom);
  const deleteItem = useSetAtom(handleItemDeleteAtom);
  const updateItem = useSetAtom(handleItemUpdateAtom);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {fieldCodes.map((value, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <JotaiFieldSelect
            fieldPropertiesAtom={fileFieldPropertiesAtom}
            onChange={(code) => updateItem({ index: i, newItem: code })}
            fieldCode={value}
          />
          <Tooltip title={t('config.fieldCodes.addField')}>
            <IconButton size='small' onClick={() => addItem({ newItem: '', index: i + 1 })}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {fieldCodes.length > 1 && (
            <Tooltip title={t('config.fieldCodes.deleteField')}>
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

function FieldCodesFormPlaceholder() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {new Array(3).fill('').map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton variant='rounded' width={400} height={56} />
          <Skeleton variant='circular' width={24} height={24} />
          <Skeleton variant='circular' width={24} height={24} />
        </div>
      ))}
    </div>
  );
}

export default function FieldCodesForm() {
  return (
    <Suspense fallback={<FieldCodesFormPlaceholder />}>
      <FieldCodesFormComponent />
    </Suspense>
  );
}
