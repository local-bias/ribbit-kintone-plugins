import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { useArray } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, IconButton, MenuItem, TextField, Tooltip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { appFieldsAtom } from '../../../states/kintone';
import { nanoid } from 'nanoid';
import styled from '@emotion/styled';

const conditionPropertyAtom = getConditionPropertyAtom('customIDRules');

const FieldSelectComponent: FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => {
  const appProperties = useAtomValue(appFieldsAtom);

  return (
    <Autocomplete
      value={appProperties.find((field) => field.code === value)}
      options={appProperties}
      isOptionEqualToValue={(option, v) => option.code === v.code}
      getOptionLabel={(option) => `${option.label}(${option.code})`}
      onChange={(e, newValue) => onChange(newValue?.code ?? '')}
      sx={{ width: '320px' }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('config.condition.fieldCode.label')}
          placeholder={t('config.condition.fieldCode.placeholder')}
          variant='outlined'
          color='primary'
        />
      )}
    />
  );
};

const RulesGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const RuleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Component: FC = () => {
  const rules = useAtomValue(conditionPropertyAtom);
  const { addItem, deleteItem, updateItem } = useArray(conditionPropertyAtom);

  return (
    <RulesGrid>
      {rules.map((rule, index) => (
        <RuleRow key={index}>
          <div>{index + 1}.</div>
          <TextField
            select
            sx={{ width: '200px' }}
            value={rule.type}
            // @ts-expect-error 型定義不足
            onChange={(e) => updateItem({ index, newItem: { ...rule, type: e.target.value } })}
          >
            {[
              { label: 'nanoid', value: 'nanoid' },
              { label: 'uuid', value: 'uuid' },
              { label: 'ランダム', value: 'random' },
              // { label: 'フィールド', value: 'field_value' },
              { label: '固定値', value: 'constant' },
            ].map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {rule.type === 'field_value' && (
            <FieldSelectComponent
              value={rule.fieldCode}
              onChange={(value) => updateItem({ index, newItem: { ...rule, fieldCode: value } })}
            />
          )}
          {rule.type === 'constant' && (
            <TextField
              label={t('config.condition.customIDRules.constant.label')}
              placeholder={t('config.condition.customIDRules.constant.placeholder')}
              value={rule.value}
              onChange={(e) => updateItem({ index, newItem: { ...rule, value: e.target.value } })}
            />
          )}

          {/*
          固定値があれば、prefixは不要
          <TextField
            label={t('config.condition.customIDRules.prefix.label')}
            value={rule.prefix}
            onChange={(e) => updateItem({ index, newItem: { ...rule, prefix: e.target.value } })}
          /> */}
          <Tooltip title={t('config.condition.customIDRules.rules.add')}>
            <IconButton
              size='small'
              onClick={() =>
                addItem({ newItem: { id: nanoid(), type: 'nanoid', prefix: '' }, index: index + 1 })
              }
            >
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {rules.length > 1 && (
            <Tooltip title={t('config.condition.customIDRules.rules.delete')}>
              <IconButton size='small' onClick={() => deleteItem(index)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </RuleRow>
      ))}
    </RulesGrid>
  );
};

const conditionModeAtom = getConditionPropertyAtom('mode');

const TogglePanelContainer = styled.div`
  padding: 8px 16px;
  margin-left: 16px;
  margin-top: 8px;
  border-left: 1px solid hsl(var(--ribbit-border));
`;

const SectionHeading = styled.h3`
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
`;

const CustomIDRulesForm: FC = () => {
  const mode = useAtomValue(conditionModeAtom);

  if (mode !== 'custom') {
    return null;
  }
  return (
    <TogglePanelContainer>
      <PluginFormSection>
        <SectionHeading>{t('config.condition.customIDRules.title')}</SectionHeading>
        <PluginFormDescription last>
          {t('config.condition.customIDRules.description')}
        </PluginFormDescription>
        <Component />
      </PluginFormSection>
    </TogglePanelContainer>
  );
};

export default CustomIDRulesForm;
