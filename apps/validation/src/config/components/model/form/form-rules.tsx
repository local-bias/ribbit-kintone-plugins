import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Card,
  CardContent,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  Tooltip,
} from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { useAtomCallback } from '@repo/jotai/utils';
import { Suspense, useCallback, useMemo } from 'react';
import { getConditionPropertyAtom, selectedFieldPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewRule } from '@/lib/plugin';
import type { ValidationRule, ValidationType } from '@/schema/plugin-config';

/**
 * チェック種類の選択肢。
 * ラベルは表示時に翻訳するため、ここでは並び順と値の入力要否のみを定義する。
 */
const VALIDATION_TYPE_OPTIONS: { value: ValidationType; requiresValue: boolean }[] = [
  // 基本チェック
  { value: 'required', requiresValue: false },
  // 文字数チェック
  { value: 'minLength', requiresValue: true },
  { value: 'maxLength', requiresValue: true },
  { value: 'exactLength', requiresValue: true },
  // 数値チェック
  { value: 'minValue', requiresValue: true },
  { value: 'maxValue', requiresValue: true },
  { value: 'range', requiresValue: true },
  // 形式チェック
  { value: 'email', requiresValue: false },
  { value: 'url', requiresValue: false },
  { value: 'phone', requiresValue: false },
  { value: 'postalCode', requiresValue: false },
  // 文字種チェック
  { value: 'alphanumeric', requiresValue: false },
  { value: 'numeric', requiresValue: false },
  { value: 'alpha', requiresValue: false },
  { value: 'hiragana', requiresValue: false },
  { value: 'katakana', requiresValue: false },
  { value: 'halfwidthKatakana', requiresValue: false },
  { value: 'fullwidth', requiresValue: false },
  { value: 'halfwidth', requiresValue: false },
  { value: 'fullwidthAlphanumeric', requiresValue: false },
  // 日本の商習慣向けチェック
  { value: 'corporateNumber', requiresValue: false },
  { value: 'bankAccount', requiresValue: false },
  // 文字列チェック
  { value: 'contains', requiresValue: true },
  { value: 'notContains', requiresValue: true },
  { value: 'startsWith', requiresValue: true },
  { value: 'endsWith', requiresValue: true },
  // カスタムチェック
  { value: 'pattern', requiresValue: true },
];

/** チェック種類の表示名を返します。 */
function getValidationTypeLabel(type: ValidationType): string {
  return t(`validationType.${type}` as 'validationType.required');
}

/**
 * チェック種類を選び直した際に初期表示する、既定のエラーメッセージを返します。
 * 設定情報として保存されるため、設定画面の言語の文言が採用されます。
 */
function getDefaultErrorMessage(type: ValidationType): string {
  return t(`defaultErrorMessage.${type}` as 'defaultErrorMessage.required');
}

const rulesAtom = getConditionPropertyAtom('rules');

function ValidationRuleItem({
  rule,
  index,
  onUpdate,
  onDelete,
  canDelete,
  disabledTypes,
}: {
  rule: ValidationRule;
  index: number;
  onUpdate: (index: number, updatedRule: ValidationRule) => void;
  onDelete: (index: number) => void;
  canDelete: boolean;
  disabledTypes: Partial<Record<ValidationType, string>>;
}) {
  const typeOption = VALIDATION_TYPE_OPTIONS.find((opt) => opt.value === rule.type);
  const requiresValue = typeOption?.requiresValue ?? false;

  const handleTypeChange = (newType: ValidationType) => {
    onUpdate(index, {
      ...rule,
      type: newType,
      value: '',
      errorMessage: getDefaultErrorMessage(newType),
    });
  };

  const handleValueChange = (newValue: string) => {
    onUpdate(index, { ...rule, value: newValue });
  };

  const handleErrorMessageChange = (newMessage: string) => {
    onUpdate(index, { ...rule, errorMessage: newMessage });
  };

  return (
    <Card variant='outlined'>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex items-center gap-4'>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>{t('config.rule.type.label')}</InputLabel>
            <Select
              value={rule.type}
              label={t('config.rule.type.label')}
              onChange={(e) => handleTypeChange(e.target.value as ValidationType)}
            >
              {VALIDATION_TYPE_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={!!disabledTypes[option.value]}
                >
                  {getValidationTypeLabel(option.value)}
                </MenuItem>
              ))}
            </Select>
            {disabledTypes[rule.type] && (
              <FormHelperText error>{disabledTypes[rule.type]}</FormHelperText>
            )}
          </FormControl>
          {requiresValue && (
            <TextField
              label={getValueLabel(rule.type)}
              value={rule.value}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={getValuePlaceholder(rule.type)}
              sx={{ minWidth: 200 }}
            />
          )}
          {canDelete && (
            <Tooltip title={t('config.rule.delete')}>
              <IconButton onClick={() => onDelete(index)} color='error'>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
        <TextField
          label={t('config.rule.errorMessage.label')}
          value={rule.errorMessage}
          onChange={(e) => handleErrorMessageChange(e.target.value)}
          fullWidth
          placeholder={t('config.rule.errorMessage.placeholder')}
        />
      </CardContent>
    </Card>
  );
}

function getValueLabel(type: ValidationType): string {
  switch (type) {
    case 'minLength':
    case 'maxLength':
    case 'exactLength':
      return t('config.rule.value.label.length');
    case 'pattern':
      return t('config.rule.value.label.pattern');
    case 'minValue':
    case 'maxValue':
      return t('config.rule.value.label.number');
    case 'range':
      return t('config.rule.value.label.range');
    case 'contains':
    case 'notContains':
    case 'startsWith':
    case 'endsWith':
      return t('config.rule.value.label.text');
    default:
      return t('config.rule.value.label.default');
  }
}

function getValuePlaceholder(type: ValidationType): string {
  switch (type) {
    case 'minLength':
    case 'maxLength':
    case 'exactLength':
      return t('config.rule.value.placeholder.length');
    case 'pattern':
      return t('config.rule.value.placeholder.pattern');
    case 'minValue':
    case 'maxValue':
      return t('config.rule.value.placeholder.number');
    case 'range':
      return t('config.rule.value.placeholder.range');
    case 'contains':
    case 'notContains':
      return t('config.rule.value.placeholder.contains');
    case 'startsWith':
      return t('config.rule.value.placeholder.startsWith');
    case 'endsWith':
      return t('config.rule.value.placeholder.endsWith');
    default:
      return '';
  }
}

function ValidationRulesFormContent() {
  const rules = useAtomValue(rulesAtom);
  const field = useAtomValue(selectedFieldPropertyAtom);
  const isFileField = field?.type === 'FILE';

  const disabledTypes = useMemo<Partial<Record<ValidationType, string>>>(
    () => (isFileField ? { required: t('config.rule.fileRequiredDisabled') } : {}),
    [isFileField]
  );

  const handleAdd = useAtomCallback(
    useCallback((_, set) => {
      set(rulesAtom, (prev) => [...prev, getNewRule()]);
    }, [])
  );

  const handleUpdate = useAtomCallback(
    useCallback((_, set, index: number, updatedRule: ValidationRule) => {
      set(rulesAtom, (prev) => {
        const newRules = [...prev];
        newRules[index] = updatedRule;
        return newRules;
      });
    }, [])
  );

  const handleDelete = useAtomCallback(
    useCallback((_, set, index: number) => {
      set(rulesAtom, (prev) => prev.filter((_, i) => i !== index));
    }, [])
  );

  return (
    <div className='flex flex-col gap-4'>
      {isFileField && <Alert severity='info'>{t('config.rule.fileRequiredDisabled')}</Alert>}
      {rules.map((rule, index) => (
        <ValidationRuleItem
          key={rule.id}
          rule={rule}
          index={index}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canDelete={rules.length > 1}
          disabledTypes={disabledTypes}
        />
      ))}
      <div>
        <Tooltip title={t('config.rule.add')}>
          <IconButton onClick={handleAdd} color='primary'>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}

function ValidationRulesFormPlaceholder() {
  return <Skeleton variant='rounded' width='100%' height={120} />;
}

export default function ValidationRulesForm() {
  return (
    <Suspense fallback={<ValidationRulesFormPlaceholder />}>
      <ValidationRulesFormContent />
    </Suspense>
  );
}
