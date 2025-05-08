import { currentAppFormFieldsAtom } from '@/config/states/kintone';
import { RULE_TYPES, RuleTypeKey } from '@/lib/constants';
import { getNewRule } from '@/lib/plugin';
import styled from '@emotion/styled';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormControlLabel, IconButton, MenuItem, Switch, TextField, Tooltip } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC, FCX } from 'react';
import { clone } from 'remeda';
import { handleTargetFieldChangeAtom, rulesAtom, targetFieldAtom } from '../../../states/plugin';
import { PluginFormSection, PluginFormTitle } from '@konomi-app/kintone-utilities-react';
import ConditionDeleteButton from '../condition-delete-button';

const handleRuleTypeChangeAtom = atom(null, (_, set, i: number, value: RuleTypeKey) => {
  set(rulesAtom, (prev) => {
    const newRules = clone(prev);
    newRules[i]!.type = value;
    return newRules;
  });
});

const handleRuleFieldChangeAtom = atom(null, (_, set, i: number, value: string) => {
  set(rulesAtom, (prev) => {
    const newRules = clone(prev);
    newRules[i]!.field = value;
    return newRules;
  });
});

const handleRuleValueChangeAtom = atom(null, (_, set, i: number, value: string) => {
  set(rulesAtom, (prev) => {
    const newRules = clone(prev);
    newRules[i]!.value = value;
    return newRules;
  });
});

const handleRuleEditableChangeAtom = atom(null, (_, set, i: number, checked: boolean) => {
  set(rulesAtom, (prev) => {
    const newRules = clone(prev);
    newRules[i]!.editable = checked;
    return newRules;
  });
});

const addRuleAtom = atom(null, (_, set, i: number) => {
  set(rulesAtom, (prev) => {
    const newRules = clone(prev);
    newRules.splice(i + 1, 0, getNewRule());
    return newRules;
  });
});

const removeRuleAtom = atom(null, (_, set, i: number) => {
  set(rulesAtom, (prev) => {
    const newRules = clone(prev);
    newRules.splice(i, 1);
    return newRules;
  });
});

const TargetFieldForm: FC = () => {
  const targetField = useAtomValue(targetFieldAtom);
  const onTargetChange = useSetAtom(handleTargetFieldChangeAtom);

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={currentAppFormFieldsAtom}
      fieldCode={targetField}
      onChange={onTargetChange}
    />
  );
};

const RulesForm: FC = () => {
  const rules = useAtomValue(rulesAtom);

  const onRuleTypeChange = useSetAtom(handleRuleTypeChangeAtom);
  const onRuleFieldChange = useSetAtom(handleRuleFieldChangeAtom);
  const onRuleValueChange = useSetAtom(handleRuleValueChangeAtom);
  const onRuleEditableChange = useSetAtom(handleRuleEditableChangeAtom);
  const addRule = useSetAtom(addRuleAtom);
  const removeRule = useSetAtom(removeRuleAtom);

  return (
    <>
      {rules.map((rule, i) => (
        <div key={i}>
          {!['always'].includes(rule.type) && (
            <JotaiFieldSelect
              fieldPropertiesAtom={currentAppFormFieldsAtom}
              fieldCode={rule.field}
              sx={{ width: '300px' }}
              onChange={(code) => onRuleFieldChange(i, code)}
            />
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
          {rules.length > 1 && (
            <Tooltip title='この条件設定を削除する'>
              <IconButton size='small' onClick={() => removeRule(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ))}
    </>
  );
};

const Component: FCX = ({ className }) => (
  <div {...{ className }}>
    <PluginFormSection>
      <PluginFormTitle>入力可否を制御するフィールド</PluginFormTitle>
      <TargetFieldForm />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>ルール</PluginFormTitle>
      <div className='rule'>
        <RulesForm />
      </div>
    </PluginFormSection>
    <ConditionDeleteButton />
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

  .rule {
    display: grid;
    gap: 16px;

    & > div {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  .input {
    min-width: 250px;
  }
`;

export default StyledComponent;
