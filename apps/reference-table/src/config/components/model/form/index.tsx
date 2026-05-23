import {
  JotaiAppSelect,
  JotaiFieldMultiSelect,
  JotaiFieldSelect,
  useArray,
} from '@konomi-app/kintone-utilities-jotai';
import {
  FieldConditionInput,
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import {
  Alert,
  Autocomplete,
  Box,
  FormControlLabel,
  IconButton,
  MenuItem,
  Skeleton,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Link2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { type ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  currentAppDynamicQueryFieldsAtom,
  currentAppSpaceFieldsAtom,
  isRelatedAppMatchingFieldInSubtableAtom,
  kintoneAppsAtom,
  type RelatedAppQueryField,
  relatedAppDynamicQueryFieldsAtom,
  relatedAppFilterableFieldsAtom,
  relatedAppSelectableFieldsAtom,
  relatedAppSortableFieldsAtom,
  relatedAppSubtableFieldsAtom,
  selectedSubtableFieldsAtom,
} from '@/config/states/kintone';
import {
  aggregationDecimalDigitsAtom,
  aggregationRoundingModeAtom,
  filterSubtableRowsByMatchingFieldAtom,
  handleRelatedAppChangeAtom,
  handleRelatedSubtableChangeAtom,
  isConditionIdUnselectedAtom,
  mergeRelatedRecordFieldsAtom,
  recordsPerPageAtom,
  relatedAppIdAtom,
  relatedFilterConditionsAtom,
  relatedQueryConditionsAtom,
  relatedRecordFieldCodesAtom,
  relatedSubtableCodeAtom,
  showFieldAggregationsAtom,
  sortFieldCodeAtom,
  sortOrderAtom,
  subtableFieldCodesAtom,
  targetSpaceIdAtom,
} from '@/config/states/plugin';
import { getNewRelatedQueryCondition } from '@/lib/plugin';
import {
  getFallbackRelatedQueryConditionType,
  getRelatedQueryConditionTypesForField,
  isRelatedQueryConditionTypeAllowedForField,
  RELATED_QUERY_CONDITION_LABELS,
} from '@/lib/related-query-condition';
import {
  AggregationRoundingModeSchema,
  type FieldConditionValue,
  MAX_AGGREGATION_DECIMAL_DIGITS,
  MAX_RECORDS_PER_PAGE,
  MIN_AGGREGATION_DECIMAL_DIGITS,
  MIN_RECORDS_PER_PAGE,
  type RelatedQueryCondition,
  RelatedQueryConditionTypeSchema,
  SortOrderSchema,
} from '@/schema/plugin-config';

import CommonSettings from './common';
import DeleteButton from './condition-delete-button';

function LoadingField({ width = 360 }: { width?: number } = {}) {
  return <Skeleton variant='rounded' width={width} height={56} />;
}

function FormError({ label, error }: { label: string; error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <TextField
      error
      label={label}
      helperText={`情報の取得に失敗しました: ${message}`}
      sx={{ width: 360 }}
    />
  );
}

const toBoundedInteger = (params: {
  value: string;
  currentValue: number;
  min: number;
  max: number;
}) => {
  if (!params.value.trim()) {
    return params.currentValue;
  }
  const value = Number(params.value);
  if (!Number.isFinite(value)) {
    return params.currentValue;
  }
  return Math.min(params.max, Math.max(params.min, Math.trunc(value)));
};

const parseRelatedQueryConditionType = (value: unknown) => {
  const parsed = RelatedQueryConditionTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const parseAggregationRoundingMode = (value: unknown) => {
  const parsed = AggregationRoundingModeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const parseSortOrder = (value: unknown) => {
  const parsed = SortOrderSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

function TargetSpaceSelectComponent() {
  const spaces = useAtomValue(currentAppSpaceFieldsAtom);
  const [targetSpaceId, setTargetSpaceId] = useAtom(targetSpaceIdAtom);

  return (
    <Autocomplete
      value={spaces.find((field) => field.elementId === targetSpaceId) ?? null}
      sx={{ width: 420, maxWidth: '100%' }}
      options={spaces}
      isOptionEqualToValue={(option, selected) => option.elementId === selected.elementId}
      getOptionLabel={(field) => field.elementId ?? ''}
      onChange={(_, field) => setTargetSpaceId(field?.elementId ?? '')}
      noOptionsText='スペースフィールドが見つかりません'
      renderOption={(props, field) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component='li' {...optionProps}>
            <div className='grid'>
              <span>{field.elementId}</span>
              <span className='text-xs text-gray-400'>スペースフィールド</span>
            </div>
          </Box>
        );
      }}
      renderInput={(renderParams) => (
        <TextField {...renderParams} label='表示スペース' placeholder='スペースフィールドを検索' />
      )}
    />
  );
}

function TargetSpaceSelect() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <FormError label='表示スペース' error={error} />}
    >
      <Suspense fallback={<LoadingField />}>
        <TargetSpaceSelectComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function RelatedAppSelectComponent() {
  const relatedAppId = useAtomValue(relatedAppIdAtom);
  const onChange = useSetAtom(handleRelatedAppChangeAtom);

  return (
    <JotaiAppSelect
      appsAtom={kintoneAppsAtom}
      appId={relatedAppId}
      onChange={onChange}
      label='関連先アプリ'
      placeholder='アプリ名またはIDで検索'
      sx={{ width: 420, maxWidth: '100%' }}
    />
  );
}

function RelatedAppSelect() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <FormError label='関連先アプリ' error={error} />}
    >
      <Suspense fallback={<LoadingField />}>
        <RelatedAppSelectComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

const findQueryField = <T extends { code: string }>(fields: T[], fieldCode: string) => {
  return fields.find((field) => field.code === fieldCode) ?? null;
};

const normalizeRelatedQueryCondition = (
  condition: RelatedQueryCondition,
  relatedField?: RelatedAppQueryField | null
): RelatedQueryCondition => {
  if (
    isRelatedQueryConditionTypeAllowedForField(condition.type, relatedField, {
      isInSubtable: !!relatedField?.subtableCode,
    })
  ) {
    return condition;
  }
  return {
    ...condition,
    type: getFallbackRelatedQueryConditionType(relatedField, {
      isInSubtable: !!relatedField?.subtableCode,
    }),
  };
};

function RelatedQueryConditionsFormComponent() {
  const relatedAppId = useAtomValue(relatedAppIdAtom);
  const conditions = useAtomValue(relatedQueryConditionsAtom);
  const relatedFields = useAtomValue(relatedAppDynamicQueryFieldsAtom);
  const { addItem, updateItem, deleteItem } = useArray(relatedQueryConditionsAtom);
  const hasSubtableCondition = conditions.some(
    (condition) => !!findQueryField(relatedFields, condition.relatedAppFieldCode)?.subtableCode
  );
  const duplicatedRelatedFieldCodes = Array.from(
    new Set(
      conditions
        .map((condition) => condition.relatedAppFieldCode)
        .filter(
          (fieldCode, index, fieldCodes) => !!fieldCode && fieldCodes.indexOf(fieldCode) !== index
        )
    )
  );

  const updateCondition = (index: number, condition: RelatedQueryCondition) => {
    const relatedField = findQueryField(relatedFields, condition.relatedAppFieldCode);
    updateItem({ index, newItem: normalizeRelatedQueryCondition(condition, relatedField) });
  };

  if (!conditions.length) {
    return (
      <IconButton
        type='button'
        size='small'
        aria-label='取得条件を追加'
        onClick={() => addItem({ index: 0, newItem: getNewRelatedQueryCondition() })}
      >
        <PlusIcon size={18} />
      </IconButton>
    );
  }

  return (
    <div className='grid gap-3'>
      {conditions.map((condition, index) => {
        const relatedField = findQueryField(relatedFields, condition.relatedAppFieldCode);
        const conditionTypes = getRelatedQueryConditionTypesForField(relatedField, {
          isInSubtable: !!relatedField?.subtableCode,
        });
        const selectedType = isRelatedQueryConditionTypeAllowedForField(
          condition.type,
          relatedField,
          { isInSubtable: !!relatedField?.subtableCode }
        )
          ? condition.type
          : getFallbackRelatedQueryConditionType(relatedField, {
              isInSubtable: !!relatedField?.subtableCode,
            });

        return (
          <div key={condition.id} className='flex flex-wrap items-center gap-3'>
            <JotaiFieldSelect
              fieldPropertiesAtom={currentAppDynamicQueryFieldsAtom}
              fieldCode={condition.currentAppFieldCode}
              onChange={(currentAppFieldCode) =>
                updateCondition(index, { ...condition, currentAppFieldCode })
              }
              label='このアプリの値'
              placeholder='フィールド名またはコードで検索'
              sx={{ width: 300, maxWidth: '100%' }}
            />
            <TextField
              select
              label='比較方法'
              value={selectedType}
              sx={{ width: 180, maxWidth: '100%' }}
              onChange={(event) => {
                const nextType = parseRelatedQueryConditionType(event.target.value);
                if (nextType) {
                  updateCondition(index, { ...condition, type: nextType });
                }
              }}
            >
              {conditionTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {RELATED_QUERY_CONDITION_LABELS[type]}
                </MenuItem>
              ))}
            </TextField>
            <Link2Icon className='w-5 h-5 text-gray-400 shrink-0' />
            <JotaiFieldSelect
              fieldPropertiesAtom={relatedAppDynamicQueryFieldsAtom}
              fieldCode={condition.relatedAppFieldCode}
              onChange={(relatedAppFieldCode) => {
                const nextRelatedField = findQueryField(relatedFields, relatedAppFieldCode);
                updateCondition(
                  index,
                  normalizeRelatedQueryCondition(
                    { ...condition, relatedAppFieldCode },
                    nextRelatedField
                  )
                );
              }}
              label='関連先アプリの検索フィールド'
              placeholder={
                relatedAppId ? 'フィールド名またはコードで検索' : '先に関連先アプリを選択'
              }
              disabled={!relatedAppId}
              sx={{ width: 340, maxWidth: '100%' }}
            />
            <Tooltip title='取得条件を追加する'>
              <IconButton
                type='button'
                size='small'
                onClick={() =>
                  addItem({ index: index + 1, newItem: getNewRelatedQueryCondition() })
                }
              >
                <PlusIcon size={18} />
              </IconButton>
            </Tooltip>
            {conditions.length > 1 && (
              <Tooltip title='この取得条件を削除する'>
                <IconButton type='button' size='small' onClick={() => deleteItem(index)}>
                  <Trash2Icon size={18} />
                </IconButton>
              </Tooltip>
            )}
          </div>
        );
      })}
      {hasSubtableCondition && (
        <Alert severity='info' sx={{ maxWidth: 720 }}>
          関連先アプリのサブテーブル内フィールドは、kintoneクエリの制約に合わせて一致または不一致で検索します。
        </Alert>
      )}
      {duplicatedRelatedFieldCodes.length > 0 && (
        <Alert severity='warning' sx={{ maxWidth: 720 }}>
          同じ関連先フィールドに複数の取得条件が設定されています。条件はすべてANDで結合されます。
        </Alert>
      )}
    </div>
  );
}

function RelatedQueryConditionsForm() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <FormError label='関連レコードの取得条件' error={error} />}
    >
      <Suspense fallback={<LoadingField width={720} />}>
        <RelatedQueryConditionsFormComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

const getNewRelatedFilterCondition = (): FieldConditionValue => ({
  fieldCode: '',
  conditionType: 'always',
});

function RelatedFilterConditionsFormComponent() {
  const relatedAppId = useAtomValue(relatedAppIdAtom);
  const conditions = useAtomValue(relatedFilterConditionsAtom);
  const fields = useAtomValue(relatedAppFilterableFieldsAtom);
  const { addItem, updateItem, deleteItem } = useArray(relatedFilterConditionsAtom);

  if (!conditions.length) {
    return (
      <Tooltip title='絞り込み条件を追加する'>
        <span>
          <IconButton
            type='button'
            size='small'
            disabled={!relatedAppId}
            aria-label='絞り込み条件を追加'
            onClick={() => addItem({ index: 0, newItem: getNewRelatedFilterCondition() })}
          >
            <PlusIcon size={18} />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <div className='grid gap-3'>
      {conditions.map((condition, index) => (
        <div key={index} className='flex flex-wrap items-start gap-3'>
          <FieldConditionInput
            fields={fields}
            value={condition}
            onChange={(newCondition) => updateItem({ index, newItem: newCondition })}
            lang='ja'
          />
          <div className='flex items-center gap-1 pt-1'>
            <Tooltip title='絞り込み条件を追加する'>
              <IconButton
                type='button'
                size='small'
                onClick={() =>
                  addItem({ index: index + 1, newItem: getNewRelatedFilterCondition() })
                }
              >
                <PlusIcon size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title='この絞り込み条件を削除する'>
              <IconButton type='button' size='small' onClick={() => deleteItem(index)}>
                <Trash2Icon size={18} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      ))}
    </div>
  );
}

function RelatedFilterConditionsForm() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <FormError label='関連レコードの絞り込み条件' error={error} />
      )}
    >
      <Suspense fallback={<LoadingField width={720} />}>
        <RelatedFilterConditionsFormComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function MergeRelatedRecordFieldsSwitch() {
  const [checked, setChecked] = useAtom(mergeRelatedRecordFieldsAtom);

  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(event) => setChecked(event.target.checked)} />}
      label='関連レコードのフィールドをレコード単位で結合して表示'
    />
  );
}

function FilterMatchingSubtableRowsSwitchComponent() {
  const isShown = useAtomValue(isRelatedAppMatchingFieldInSubtableAtom);
  const [checked, setChecked] = useAtom(filterSubtableRowsByMatchingFieldAtom);

  if (!isShown) {
    return null;
  }

  return (
    <div className='grid gap-2'>
      <FormControlLabel
        control={
          <Switch checked={checked} onChange={(event) => setChecked(event.target.checked)} />
        }
        label='このアプリの照合フィールドと一致する行のみ'
      />
      <Alert severity='info' sx={{ maxWidth: 560 }}>
        照合フィールドとしてサブテーブル内のフィールドを選択した場合、通常は条件に一致する行が1行以上あるレコードが取得され、照合フィールドと一致しない行も含めて表示されます。この設定を有効にすると、照合フィールドと一致する行があるレコードのうち、その行と照合フィールドが一致する行だけを表示します。
      </Alert>
    </div>
  );
}

function FilterMatchingSubtableRowsSwitch() {
  return (
    <ErrorBoundary FallbackComponent={() => null}>
      <Suspense fallback={null}>
        <FilterMatchingSubtableRowsSwitchComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function FieldAggregationsSwitch() {
  const [checked, setChecked] = useAtom(showFieldAggregationsAtom);

  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={(event) => setChecked(event.target.checked)} />}
      label='数値・計算フィールドの集計値を表示'
    />
  );
}

function RecordsPerPageField() {
  const [recordsPerPage, setRecordsPerPage] = useAtom(recordsPerPageAtom);

  return (
    <TextField
      type='number'
      label='一度に表示するレコード数'
      value={recordsPerPage}
      onChange={(event) =>
        setRecordsPerPage(
          toBoundedInteger({
            value: event.target.value,
            currentValue: recordsPerPage,
            min: MIN_RECORDS_PER_PAGE,
            max: MAX_RECORDS_PER_PAGE,
          })
        )
      }
      helperText={`${MIN_RECORDS_PER_PAGE}〜${MAX_RECORDS_PER_PAGE}の範囲で指定します`}
      slotProps={{ htmlInput: { min: MIN_RECORDS_PER_PAGE, max: MAX_RECORDS_PER_PAGE, step: 1 } }}
      sx={{ width: 260, maxWidth: '100%' }}
    />
  );
}

function FieldAggregationSettings() {
  const checked = useAtomValue(showFieldAggregationsAtom);
  const [roundingMode, setRoundingMode] = useAtom(aggregationRoundingModeAtom);
  const [decimalDigits, setDecimalDigits] = useAtom(aggregationDecimalDigitsAtom);

  return (
    <div className='grid gap-3'>
      <FieldAggregationsSwitch />
      <div className='flex flex-wrap gap-4 pl-12'>
        <TextField
          select
          disabled={!checked}
          label='集計値の端数処理'
          value={roundingMode}
          onChange={(event) => {
            const nextRoundingMode = parseAggregationRoundingMode(event.target.value);
            if (nextRoundingMode) {
              setRoundingMode(nextRoundingMode);
            }
          }}
          sx={{ width: 200, maxWidth: '100%' }}
        >
          <MenuItem value='round'>四捨五入</MenuItem>
          <MenuItem value='ceil'>切り上げ</MenuItem>
          <MenuItem value='floor'>切り捨て</MenuItem>
        </TextField>
        <TextField
          type='number'
          disabled={!checked}
          label='小数点以下最大表示桁数'
          value={decimalDigits}
          onChange={(event) =>
            setDecimalDigits(
              toBoundedInteger({
                value: event.target.value,
                currentValue: decimalDigits,
                min: MIN_AGGREGATION_DECIMAL_DIGITS,
                max: MAX_AGGREGATION_DECIMAL_DIGITS,
              })
            )
          }
          helperText={`${MIN_AGGREGATION_DECIMAL_DIGITS}〜${MAX_AGGREGATION_DECIMAL_DIGITS}の範囲で指定します`}
          slotProps={{
            htmlInput: {
              min: MIN_AGGREGATION_DECIMAL_DIGITS,
              max: MAX_AGGREGATION_DECIMAL_DIGITS,
              step: 1,
            },
          }}
          sx={{ width: 240, maxWidth: '100%' }}
        />
      </div>
    </div>
  );
}

function RelatedSubtableSelectComponent() {
  const relatedAppId = useAtomValue(relatedAppIdAtom);
  const fieldCode = useAtomValue(relatedSubtableCodeAtom);
  const onChange = useSetAtom(handleRelatedSubtableChangeAtom);

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={relatedAppSubtableFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label='表示するサブテーブル'
      placeholder={relatedAppId ? 'サブテーブルを検索（任意）' : '先に関連先アプリを選択'}
      disabled={!relatedAppId}
      sx={{ width: 420, maxWidth: '100%' }}
    />
  );
}

function FieldSelectWithBoundary(params: { children: ReactNode; label: string }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <FormError label={params.label} error={error} />}
    >
      <Suspense fallback={<LoadingField />}>{params.children}</Suspense>
    </ErrorBoundary>
  );
}

function RelatedRecordFieldsSelectComponent() {
  const relatedAppId = useAtomValue(relatedAppIdAtom);
  const [fieldCodes, setFieldCodes] = useAtom(relatedRecordFieldCodesAtom);

  return (
    <JotaiFieldMultiSelect
      fieldPropertiesAtom={relatedAppSelectableFieldsAtom}
      fieldCodes={fieldCodes}
      onChange={setFieldCodes}
      label='表示する関連レコードフィールド'
      placeholder={relatedAppId ? '表示するフィールドを検索' : '先に関連先アプリを選択'}
      disabled={!relatedAppId}
      sx={{ width: 560, maxWidth: '100%' }}
    />
  );
}

function SubtableFieldsSelectComponent() {
  const relatedSubtableCode = useAtomValue(relatedSubtableCodeAtom);
  const [fieldCodes, setFieldCodes] = useAtom(subtableFieldCodesAtom);

  return (
    <JotaiFieldMultiSelect
      fieldPropertiesAtom={selectedSubtableFieldsAtom}
      fieldCodes={fieldCodes}
      onChange={setFieldCodes}
      label='サブテーブルから表示する列'
      placeholder={
        relatedSubtableCode ? '表示するサブテーブル列を検索' : 'サブテーブルを使用する場合に選択'
      }
      disabled={!relatedSubtableCode}
      sx={{ width: 560, maxWidth: '100%' }}
    />
  );
}

function SortSettingsComponent() {
  const relatedAppId = useAtomValue(relatedAppIdAtom);
  const [sortFieldCode, setSortFieldCode] = useAtom(sortFieldCodeAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);

  return (
    <div className='flex flex-wrap gap-4'>
      <JotaiFieldSelect
        fieldPropertiesAtom={relatedAppSortableFieldsAtom}
        fieldCode={sortFieldCode}
        label='関連レコードの並び替えフィールド'
        placeholder={relatedAppId ? '並び替えフィールドを検索' : '先に関連先アプリを選択'}
        disabled={!relatedAppId}
        onChange={(fieldCode) => setSortFieldCode(fieldCode || '$id')}
        sx={{ width: 420, maxWidth: '100%' }}
      />
      <TextField
        select
        label='並び順'
        value={sortOrder}
        onChange={(event) => {
          const nextSortOrder = parseSortOrder(event.target.value);
          if (nextSortOrder) {
            setSortOrder(nextSortOrder);
          }
        }}
        sx={{ width: 160 }}
      >
        <MenuItem value='asc'>昇順</MenuItem>
        <MenuItem value='desc'>降順</MenuItem>
      </TextField>
    </div>
  );
}

function FormContent() {
  return (
    <div className='p-4 max-w-5xl'>
      <PluginFormSection>
        <PluginFormTitle>表示先</PluginFormTitle>
        <PluginFormDescription last>
          レコード詳細画面に配置したスペースフィールドを選択します。
        </PluginFormDescription>
        <TargetSpaceSelect />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>関連先</PluginFormTitle>
        <PluginFormDescription last>
          このアプリのフィールド値を使って、関連先アプリから取得するレコードの条件を設定します。
        </PluginFormDescription>
        <div className='grid gap-4'>
          <RelatedAppSelect />
          <RelatedQueryConditionsForm />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>絞り込み条件</PluginFormTitle>
        <PluginFormDescription last>
          関連先レコードをさらに絞り込む条件を設定します。条件はすべてANDで結合されます。
        </PluginFormDescription>
        <RelatedFilterConditionsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>テーブル表示</PluginFormTitle>
        <PluginFormDescription last>
          関連レコードのフィールドをテーブルで表示します。必要に応じて、関連先アプリのサブテーブル行も同じテーブルに展開できます。
        </PluginFormDescription>
        <div className='grid gap-4'>
          <FieldSelectWithBoundary label='表示する関連レコードフィールド'>
            <RelatedRecordFieldsSelectComponent />
          </FieldSelectWithBoundary>
          <FieldSelectWithBoundary label='表示するサブテーブル（任意）'>
            <RelatedSubtableSelectComponent />
          </FieldSelectWithBoundary>
          <FieldSelectWithBoundary label='サブテーブルに表示する列'>
            <SubtableFieldsSelectComponent />
          </FieldSelectWithBoundary>
          <RecordsPerPageField />
          <div className='grid gap-1'>
            <MergeRelatedRecordFieldsSwitch />
            <FilterMatchingSubtableRowsSwitch />
          </div>
          <FieldAggregationSettings />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>並び順</PluginFormTitle>
        <PluginFormDescription last>関連先レコード単位の表示順を指定します。</PluginFormDescription>
        <FieldSelectWithBoundary label='並び順'>
          <SortSettingsComponent />
        </FieldSelectWithBoundary>
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
}

function PluginForm() {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
}

export default PluginForm;
