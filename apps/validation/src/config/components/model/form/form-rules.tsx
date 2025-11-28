import { getConditionPropertyAtom } from '@/config/states/plugin';
import { getNewRule } from '@/lib/plugin';
import { ValidationRule, ValidationType } from '@/schema/plugin-config';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';

const VALIDATION_TYPE_OPTIONS: { value: ValidationType; label: string; requiresValue: boolean }[] =
  [
    // 基本チェック
    { value: 'required', label: '必須入力', requiresValue: false },
    // 文字数チェック
    { value: 'minLength', label: '最小文字数', requiresValue: true },
    { value: 'maxLength', label: '最大文字数', requiresValue: true },
    { value: 'exactLength', label: '正確な文字数', requiresValue: true },
    // 数値チェック
    { value: 'minValue', label: '最小値（数値）', requiresValue: true },
    { value: 'maxValue', label: '最大値（数値）', requiresValue: true },
    { value: 'range', label: '数値の範囲', requiresValue: true },
    // 形式チェック
    { value: 'email', label: 'メールアドレス形式', requiresValue: false },
    { value: 'url', label: 'URL形式', requiresValue: false },
    { value: 'phone', label: '電話番号形式（日本）', requiresValue: false },
    { value: 'postalCode', label: '郵便番号形式（日本）', requiresValue: false },
    // 文字種チェック
    { value: 'alphanumeric', label: '英数字のみ', requiresValue: false },
    { value: 'numeric', label: '数字のみ', requiresValue: false },
    { value: 'alpha', label: '英字のみ', requiresValue: false },
    { value: 'hiragana', label: 'ひらがなのみ', requiresValue: false },
    { value: 'katakana', label: 'カタカナのみ', requiresValue: false },
    // 文字列チェック
    { value: 'contains', label: '特定の文字列を含む', requiresValue: true },
    { value: 'notContains', label: '特定の文字列を含まない', requiresValue: true },
    { value: 'startsWith', label: '特定の文字列で始まる', requiresValue: true },
    { value: 'endsWith', label: '特定の文字列で終わる', requiresValue: true },
    // カスタムチェック
    { value: 'pattern', label: '正規表現パターン', requiresValue: true },
  ];

const DEFAULT_ERROR_MESSAGES: Record<ValidationType, string> = {
  required: 'この項目は必須です',
  minLength: '文字数が不足しています',
  maxLength: '文字数が上限を超えています',
  exactLength: '文字数が一致しません',
  pattern: '入力形式が正しくありません',
  minValue: '値が小さすぎます',
  maxValue: '値が大きすぎます',
  range: '値が指定範囲外です',
  email: 'メールアドレスの形式が正しくありません',
  url: 'URLの形式が正しくありません',
  phone: '電話番号の形式が正しくありません',
  postalCode: '郵便番号の形式が正しくありません',
  alphanumeric: '英数字のみで入力してください',
  numeric: '数字のみで入力してください',
  alpha: '英字のみで入力してください',
  hiragana: 'ひらがなのみで入力してください',
  katakana: 'カタカナのみで入力してください',
  contains: '指定された文字列が含まれていません',
  notContains: '指定された文字列が含まれています',
  startsWith: '指定された文字列で始まっていません',
  endsWith: '指定された文字列で終わっていません',
  custom: 'エラーが発生しました',
};

const rulesAtom = getConditionPropertyAtom('rules');

function ValidationRuleItem({
  rule,
  index,
  onUpdate,
  onDelete,
  canDelete,
}: {
  rule: ValidationRule;
  index: number;
  onUpdate: (index: number, updatedRule: ValidationRule) => void;
  onDelete: (index: number) => void;
  canDelete: boolean;
}) {
  const typeOption = VALIDATION_TYPE_OPTIONS.find((opt) => opt.value === rule.type);
  const requiresValue = typeOption?.requiresValue ?? false;

  const handleTypeChange = (newType: ValidationType) => {
    onUpdate(index, {
      ...rule,
      type: newType,
      value: '',
      errorMessage: DEFAULT_ERROR_MESSAGES[newType],
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
            <InputLabel>チェック種類</InputLabel>
            <Select
              value={rule.type}
              label='チェック種類'
              onChange={(e) => handleTypeChange(e.target.value as ValidationType)}
            >
              {VALIDATION_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
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
            <Tooltip title='このルールを削除'>
              <IconButton onClick={() => onDelete(index)} color='error'>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
        <TextField
          label='エラーメッセージ'
          value={rule.errorMessage}
          onChange={(e) => handleErrorMessageChange(e.target.value)}
          fullWidth
          placeholder='バリデーションエラー時に表示するメッセージ'
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
      return '文字数';
    case 'pattern':
      return '正規表現';
    case 'minValue':
    case 'maxValue':
      return '数値';
    case 'range':
      return '範囲（min-max）';
    case 'contains':
    case 'notContains':
    case 'startsWith':
    case 'endsWith':
      return '文字列';
    default:
      return '値';
  }
}

function getValuePlaceholder(type: ValidationType): string {
  switch (type) {
    case 'minLength':
    case 'maxLength':
    case 'exactLength':
      return '例: 10';
    case 'pattern':
      return '例: ^[0-9]+$';
    case 'minValue':
    case 'maxValue':
      return '例: 100';
    case 'range':
      return '例: 0-100';
    case 'contains':
    case 'notContains':
      return '例: @example.com';
    case 'startsWith':
      return '例: https://';
    case 'endsWith':
      return '例: .pdf';
    default:
      return '';
  }
}

export default function ValidationRulesForm() {
  const rules = useAtomValue(rulesAtom);

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
      {rules.map((rule, index) => (
        <ValidationRuleItem
          key={rule.id}
          rule={rule}
          index={index}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          canDelete={rules.length > 1}
        />
      ))}
      <div>
        <Tooltip title='ルールを追加'>
          <IconButton onClick={handleAdd} color='primary'>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
