import { useArray } from '@konomi-app/kintone-utilities-jotai';
import { FieldConditionInput } from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, MenuItem, TextField, Tooltip } from '@mui/material';
import { useAtom, useAtomValue } from '@repo/jotai';
import {
  currentAppFieldsAtom,
  cybozuGroupsAtom,
  cybozuOrganizationsAtom,
  cybozuUsersAtom,
} from '@/config/states/kintone';
import { displayConditionLogicAtom, displayConditionsAtom } from '@/config/states/plugin';
import { LANGUAGE } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getNewDisplayCondition } from '@/lib/plugin';
import type { ConditionLogic } from '@/schema/plugin-config';

/** 複数条件の結合方法を選択します */
export function DisplayConditionLogicSelect() {
  const [logic, setLogic] = useAtom(displayConditionLogicAtom);

  return (
    <TextField
      select
      label={t('config.condition.displayConditions.logic')}
      value={logic}
      sx={{ width: 320, maxWidth: '100%' }}
      onChange={(event) => setLogic(event.target.value as ConditionLogic)}
    >
      <MenuItem value='and'>{t('config.condition.displayConditions.logic.and')}</MenuItem>
      <MenuItem value='or'>{t('config.condition.displayConditions.logic.or')}</MenuItem>
    </TextField>
  );
}

/** レコードの値による表示条件を編集します */
export function DisplayConditionsInput() {
  const fields = useAtomValue(currentAppFieldsAtom);
  const users = useAtomValue(cybozuUsersAtom);
  const groups = useAtomValue(cybozuGroupsAtom);
  const organizations = useAtomValue(cybozuOrganizationsAtom);
  const conditions = useAtomValue(displayConditionsAtom);
  const { addItem, updateItem, deleteItem } = useArray(displayConditionsAtom);

  if (conditions.length === 0) {
    return (
      <Tooltip title={t('config.condition.displayConditions.add')}>
        <IconButton
          size='small'
          aria-label={t('config.condition.displayConditions.add')}
          onClick={() => addItem({ index: 0, newItem: getNewDisplayCondition() })}
        >
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {conditions.map((condition, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 条件は並び替えを行わず、インデックスで更新・削除するため
        <div key={i} className='flex flex-wrap items-start gap-3'>
          <FieldConditionInput
            fields={fields}
            value={condition}
            lang={LANGUAGE}
            users={users}
            groups={groups}
            organizations={organizations}
            onChange={(newCondition) => updateItem({ index: i, newItem: newCondition })}
          />
          <div className='flex items-center gap-1 pt-1'>
            <Tooltip title={t('config.condition.displayConditions.add')}>
              <IconButton
                size='small'
                onClick={() => addItem({ index: i + 1, newItem: getNewDisplayCondition() })}
              >
                <AddIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('config.condition.displayConditions.delete')}>
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
