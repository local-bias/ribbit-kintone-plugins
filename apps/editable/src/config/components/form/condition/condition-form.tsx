import { getNewRule } from '@/common/plugin';
import { RULE_TYPES, RuleTypeKey } from '@/common/statics';
import { currentAppFormFieldsAtom } from '@/config/states/kintone';
import styled from '@emotion/styled';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormControlLabel, IconButton, MenuItem, Switch, TextField, Tooltip } from '@mui/material';
import { produce } from 'immer';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChangeEventHandler, FC, FCX } from 'react';
import { pluginConfigAtom } from '../../../states/plugin';

type ContainerProps = { condition: kintone.plugin.Condition; index: number };
type Props = ContainerProps & {
  appFields: kintoneAPI.FieldProperty[];
  onTargetChange: ChangeEventHandler<HTMLInputElement>;
  addRule: (rowIndex: number) => void;
  removeRule: (rowIndex: number) => void;
  onRuleTypeChange: (i: number, value: RuleTypeKey) => void;
  onRuleFieldChange: (i: number, value: string) => void;
  onRuleValueChange: (i: number, value: string) => void;
  onRuleEditableChange: (i: number, checked: boolean) => void;
};

const Component: FCX<Props> = ({
  className,
  condition,
  appFields,
  onTargetChange,
  addRule,
  removeRule,
  onRuleTypeChange,
  onRuleFieldChange,
  onRuleValueChange,
  onRuleEditableChange,
}) => (
  <div {...{ className }}>
    <div>
      <h3>入力可否を制御するフィールド</h3>
      <TextField
        select
        value={condition.targetField}
        label='フィールド名'
        onChange={onTargetChange}
        className='input'
      >
        {appFields.map(({ code, label }, i) => (
          <MenuItem key={i} value={code}>
            {label}
          </MenuItem>
        ))}
      </TextField>
    </div>
    <div className='rule'>
      <h3>ルール</h3>
      {condition.rules.map((rule, i) => (
        <div key={i}>
          {!['always'].includes(rule.type) && (
            <TextField
              select
              label='フィールド名'
              value={rule.field}
              onChange={(e) => onRuleFieldChange(i, e.target.value)}
              className='input'
            >
              {appFields.map(({ code, label }, i) => (
                <MenuItem key={i} value={code}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select
            label='条件'
            value={rule.type}
            onChange={(e) => onRuleTypeChange(i, e.target.value as RuleTypeKey)}
            className='input'
          >
            {RULE_TYPES.map(({ key, label }, i) => (
              <MenuItem key={i} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          {!['always', 'full', 'empty'].includes(rule.type) && (
            <TextField
              value={rule.value}
              label='値'
              onChange={(e) => onRuleValueChange(i, e.target.value)}
              className='input'
            ></TextField>
          )}
          <FormControlLabel
            control={<Switch color='primary' checked={rule.editable} />}
            onChange={(_, checked) => onRuleEditableChange(i, checked)}
            label={rule.editable ? '編集可' : '編集不可'}
          />
          <Tooltip title='条件設定を追加する'>
            <IconButton size='small' onClick={() => addRule(i)}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {condition.rules.length > 1 && (
            <Tooltip title='この条件設定を削除する'>
              <IconButton size='small' onClick={() => removeRule(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ))}
    </div>
  </div>
);

const StyledComponent = styled(Component)`
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  h3 {
    font-weight: 500;
  }

  > div {
    padding: 8px 8px 8px 16px;
    border-left: 3px solid #0002;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .rule {
    > div {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  }

  .input {
    min-width: 250px;
  }
`;

const Container: FC<ContainerProps> = ({ condition, index }) => {
  const appFields = useAtomValue(currentAppFormFieldsAtom);
  const setStorage = useSetAtom(pluginConfigAtom);

  const onTargetChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.targetField = e.target.value;
      })
    );
  };
  const onRuleTypeChange = (i: number, value: RuleTypeKey) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.rules[i]!.type = value;
      })
    );
  };
  const onRuleFieldChange = (i: number, value: string) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.rules[i]!.field = value;
      })
    );
  };
  const onRuleValueChange = (i: number, value: string) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.rules[i]!.value = value;
      })
    );
  };
  const onRuleEditableChange = (i: number, checked: boolean) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.rules[i]!.editable = checked;
      })
    );
  };
  const addRule = (rowIndex: number) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.rules.splice(rowIndex + 1, 0, getNewRule());
      })
    );
  };
  const removeRule = (rowIndex: number) => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions[index]!.rules.splice(rowIndex, 1);
      })
    );
  };

  return (
    <StyledComponent
      {...{
        condition,
        index,
        appFields,
        onTargetChange,
        addRule,
        removeRule,
        onRuleTypeChange,
        onRuleFieldChange,
        onRuleValueChange,
        onRuleEditableChange,
      }}
    />
  );
};

export default Container;
