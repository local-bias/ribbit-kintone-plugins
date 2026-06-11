import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton, Skeleton, TextField, Tooltip } from '@mui/material';
import { useArrayAtom, useAtomValue, useSetAtom } from '@repo/jotai';
import { nanoid } from 'nanoid';
import { Suspense } from 'react';
import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import type { AutocompleteRule } from '@/schema/plugin-config';

const rulesAtom = getConditionPropertyAtom('autocompleteRules');

const { handleItemAddAtom, handleItemDeleteAtom, handleItemUpdateAtom } = useArrayAtom(rulesAtom);

const createNewRule = (): AutocompleteRule => ({
  id: nanoid(),
  sourceFieldCode: '',
  targetFieldCode: '',
  instruction: '',
});

function RulesContent() {
  const rules = useAtomValue(rulesAtom);
  const addItem = useSetAtom(handleItemAddAtom);
  const deleteItem = useSetAtom(handleItemDeleteAtom);
  const updateItem = useSetAtom(handleItemUpdateAtom);

  return (
    <div className='flex flex-col gap-4'>
      {rules.map((rule, index) => (
        <div key={rule.id} className='flex flex-col gap-2 rounded-md border border-gray-200 p-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-bold text-gray-700'>ルール {index + 1}</span>
            <Tooltip title='このルールを削除する'>
              <IconButton size='small' onClick={() => deleteItem(index)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex flex-col gap-1'>
              <span className='text-xs text-gray-500'>ソースフィールド</span>
              <JotaiFieldSelect
                fieldPropertiesAtom={currentAppFieldsAtom}
                fieldCode={rule.sourceFieldCode}
                onChange={(code) =>
                  updateItem({ index, newItem: { ...rule, sourceFieldCode: code } })
                }
              />
            </div>
            <div className='flex flex-col gap-1'>
              <span className='text-xs text-gray-500'>対象フィールド</span>
              <JotaiFieldSelect
                fieldPropertiesAtom={currentAppFieldsAtom}
                fieldCode={rule.targetFieldCode}
                onChange={(code) =>
                  updateItem({ index, newItem: { ...rule, targetFieldCode: code } })
                }
              />
            </div>
          </div>
          <TextField
            label='AIへの指示'
            placeholder='例: 入力された氏名のフリガナをカタカナで返却してください'
            multiline
            minRows={2}
            maxRows={6}
            value={rule.instruction}
            onChange={(event) =>
              updateItem({ index, newItem: { ...rule, instruction: event.target.value } })
            }
          />
        </div>
      ))}
      <div>
        <Button
          variant='outlined'
          size='small'
          startIcon={<AddIcon />}
          onClick={() => addItem({ newItem: createNewRule() })}
        >
          ルールを追加
        </Button>
      </div>
    </div>
  );
}

function RulesPlaceholder() {
  return (
    <div className='flex flex-col gap-4'>
      <Skeleton variant='rounded' height={120} />
      <Skeleton variant='rounded' height={120} />
    </div>
  );
}

export default function AutocompleteRulesForm() {
  return (
    <Suspense fallback={<RulesPlaceholder />}>
      <RulesContent />
    </Suspense>
  );
}
