import { getConditionPropertyAtom } from '@/config/states/plugin';
import { GUEST_SPACE_ID } from '@/lib/global';
import { PluginCondition } from '@/schema/plugin-config';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from '@emotion/styled';
import {
  JotaiDndContext,
  JotaiFieldSelect,
  JotaiSortableContext,
  JotaiViewMultiSelect,
} from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormControlLabel, IconButton, Switch, TextField, Tooltip } from '@mui/material';
import { appFormFieldsAtom, appViewsAtom, currentAppIdAtom } from '@repo/jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { GripVertical } from 'lucide-react';
import { nanoid } from 'nanoid';
import { FC, Suspense } from 'react';

/* ---- Atoms ---------------------------------------------------------------- */

const allRecordsAtom = getConditionPropertyAtom('allRecords');
const allFieldsAtom = getConditionPropertyAtom('allFields');
const unionAtom = getConditionPropertyAtom('union');
const dateAsExcelAtom = getConditionPropertyAtom('dateAsExcel');
const fileNameTemplateAtom = getConditionPropertyAtom('fileNameTemplate');
const sheetNameAtom = getConditionPropertyAtom('sheetName');
const targetViewsEnabledAtom = getConditionPropertyAtom('targetViewsEnabled');
const targetViewsAtom = getConditionPropertyAtom('targetViews');
const targetFieldsEnabledAtom = getConditionPropertyAtom('targetFieldsEnabled');
const targetFieldsAtom = getConditionPropertyAtom('targetFields');

/* ---- targetViews セクション ------------------------------------------------ */

const TargetViewsContent: FC = () => {
  const currentAppId = useAtomValue(currentAppIdAtom);
  const targetViews = useAtomValue(targetViewsAtom);
  const setTargetViews = useSetAtom(targetViewsAtom);

  return (
    <JotaiViewMultiSelect
      viewsAtom={appViewsAtom({ app: currentAppId, guestSpaceId: GUEST_SPACE_ID })}
      viewIds={targetViews}
      onChange={setTargetViews}
      label='対象一覧'
      placeholder='一覧を選択してください'
      className='target-select'
    />
  );
};

const TargetViewsSection: FC = () => {
  const targetViewsEnabled = useAtomValue(targetViewsEnabledAtom);
  const setTargetViewsEnabled = useSetAtom(targetViewsEnabledAtom);

  return (
    <PluginFormSection>
      <PluginFormTitle>表示する一覧の制限</PluginFormTitle>
      <PluginFormDescription last>
        有効にすると、指定した一覧でのみExcelダウンロードボタンが表示されます。
      </PluginFormDescription>
      <FormControlLabel
        control={<Switch color='primary' checked={targetViewsEnabled} />}
        onChange={(_, checked) => setTargetViewsEnabled(checked)}
        label='表示する一覧を制限する'
      />
      {targetViewsEnabled && (
        <div style={{ marginTop: 12 }}>
          <Suspense fallback={null}>
            <TargetViewsContent />
          </Suspense>
        </div>
      )}
    </PluginFormSection>
  );
};

/* ---- targetFields セクション ----------------------------------------------- */

type TargetField = PluginCondition['targetFields'][number];

type FieldRowProps = {
  item: TargetField;
  index: number;
  fieldPropertiesAtom: ReturnType<typeof appFormFieldsAtom>;
  onChange: (index: number, fieldCode: string) => void;
  onAdd: (index: number) => void;
  onDelete: (index: number) => void;
  deletable: boolean;
};

const FieldRow: FC<FieldRowProps> = ({
  item,
  index,
  fieldPropertiesAtom,
  onChange,
  onAdd,
  onDelete,
  deletable,
}) => {
  const {
    isDragging,
    setActivatorNodeRef,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
      }}
    >
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'grid',
          placeItems: 'center',
          padding: 4,
        }}
      >
        <GripVertical fontSize='small' style={{ color: '#9ca3af' }} />
      </div>
      <JotaiFieldSelect
        fieldPropertiesAtom={fieldPropertiesAtom}
        fieldCode={item.fieldCode}
        onChange={(code) => onChange(index, code)}
      />
      <Tooltip title='フィールドを追加'>
        <IconButton size='small' onClick={() => onAdd(index)}>
          <AddIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      {deletable && (
        <Tooltip title='フィールドを削除'>
          <IconButton size='small' onClick={() => onDelete(index)}>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

const TargetFieldsContent: FC = () => {
  const currentAppId = useAtomValue(currentAppIdAtom);
  const targetFields = useAtomValue(targetFieldsAtom);
  const setTargetFields = useSetAtom(targetFieldsAtom);
  const fieldPropsAtom = appFormFieldsAtom({ app: currentAppId, guestSpaceId: GUEST_SPACE_ID });

  const handleChange = (index: number, fieldCode: string) => {
    setTargetFields(targetFields.map((f, i) => (i === index ? { ...f, fieldCode } : f)));
  };

  const handleAdd = (index: number) => {
    const next = [...targetFields];
    next.splice(index + 1, 0, { id: nanoid(), fieldCode: '' });
    setTargetFields(next);
  };

  const handleDelete = (index: number) => {
    setTargetFields(targetFields.filter((_, i) => i !== index));
  };

  return (
    <JotaiDndContext atom={targetFieldsAtom as any}>
      <JotaiSortableContext atom={targetFieldsAtom}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {targetFields.map((item, i) => (
            <Suspense key={item.id} fallback={null}>
              <FieldRow
                item={item}
                index={i}
                fieldPropertiesAtom={fieldPropsAtom}
                onChange={handleChange}
                onAdd={handleAdd}
                onDelete={handleDelete}
                deletable={targetFields.length > 1}
              />
            </Suspense>
          ))}
        </div>
      </JotaiSortableContext>
    </JotaiDndContext>
  );
};

const TargetFieldsSection: FC = () => {
  const allFields = useAtomValue(allFieldsAtom);
  const setAllFields = useSetAtom(allFieldsAtom);
  const targetFieldsEnabled = useAtomValue(targetFieldsEnabledAtom);
  const setTargetFieldsEnabled = useSetAtom(targetFieldsEnabledAtom);
  const targetFields = useAtomValue(targetFieldsAtom);
  const setTargetFields = useSetAtom(targetFieldsAtom);

  const handleTargetFieldsEnabledChange = (_: unknown, checked: boolean) => {
    setTargetFieldsEnabled(checked);
    if (checked && targetFields.length === 0) {
      setTargetFields([{ id: nanoid(), fieldCode: '' }]);
    }
  };

  return (
    <PluginFormSection>
      <PluginFormTitle>出力フィールド設定</PluginFormTitle>
      <PluginFormDescription last>
        出力するフィールドの範囲を設定します。どちらも無効の場合は、表示中の一覧の表示項目・表示順に準拠します（「(すべて)」一覧の場合は順不同になります）。「全てのフィールドをダウンロードする」を有効にすると、個別設定は無効になります。
      </PluginFormDescription>
      <div className='switches'>
        <FormControlLabel
          control={<Switch color='primary' checked={allFields} />}
          onChange={(_, checked) => setAllFields(checked)}
          label='一覧の表示フィールドに関わらず、全てのフィールドをダウンロードする'
        />
        <FormControlLabel
          control={<Switch color='primary' checked={targetFieldsEnabled} disabled={allFields} />}
          onChange={handleTargetFieldsEnabledChange}
          label='出力するフィールドを個別に設定する'
          disabled={allFields}
        />
      </div>
      {targetFieldsEnabled && !allFields && (
        <div style={{ marginTop: 12 }}>
          <Suspense fallback={null}>
            <TargetFieldsContent />
          </Suspense>
        </div>
      )}
    </PluginFormSection>
  );
};

/* ---- メインフォーム --------------------------------------------------------- */

const Component: FC<{ className?: string }> = ({ className }) => {
  const allRecords = useAtomValue(allRecordsAtom);
  const union = useAtomValue(unionAtom);
  const dateAsExcel = useAtomValue(dateAsExcelAtom);
  const fileNameTemplate = useAtomValue(fileNameTemplateAtom);
  const sheetName = useAtomValue(sheetNameAtom);

  const setAllRecords = useSetAtom(allRecordsAtom);
  const setUnion = useSetAtom(unionAtom);
  const setDateAsExcel = useSetAtom(dateAsExcelAtom);
  const setFileNameTemplate = useSetAtom(fileNameTemplateAtom);
  const setSheetName = useSetAtom(sheetNameAtom);

  return (
    <div {...{ className }}>
      <TargetViewsSection />
      <PluginFormSection>
        <PluginFormTitle>出力オプション</PluginFormTitle>
        <PluginFormDescription last></PluginFormDescription>
        <div className='switches'>
          <FormControlLabel
            control={<Switch color='primary' checked={allRecords} />}
            onChange={(_, checked) => setAllRecords(checked)}
            label='一覧の表示件数に関わらず、検索条件に当てはまる全てのレコードをダウンロードする'
          />
          <FormControlLabel
            control={<Switch color='primary' checked={union} />}
            onChange={(_, checked) => setUnion(checked)}
            label='サブテーブルでないフィールドの行を結合する'
          />
          <FormControlLabel
            control={<Switch color='primary' checked={dateAsExcel} />}
            onChange={(_, checked) => setDateAsExcel(checked)}
            label='日付・日時・時刻フィールドをExcel日付形式で出力する (日付の並び替えや計算が可能になります)'
          />
        </div>
      </PluginFormSection>
      <TargetFieldsSection />
      <PluginFormSection>
        <PluginFormTitle>ファイル名・シート名設定</PluginFormTitle>
        <PluginFormDescription last>
          テンプレートで使用できる変数は以下の通りです。
          <ul>
            <li>
              <code>{'{appName}'}</code> - アプリ名
            </li>
            <li>
              <code>{'{date}'}</code> - 日付 (YYYY-MM-DD)
            </li>
            <li>
              <code>{'{time}'}</code> - 時刻 (HH-mm)
            </li>
            <li>
              <code>{'{appId}'}</code> - アプリID
            </li>
          </ul>
        </PluginFormDescription>
        <div className='file-name-section'>
          <TextField
            label='ファイル名テンプレート'
            value={fileNameTemplate}
            onChange={(e) => setFileNameTemplate(e.target.value)}
            helperText='例: {appName}_{date}'
            fullWidth
          />
          <TextField
            label='シート名テンプレート'
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            helperText='最大31文字。\ / : * ? [ ] は自動的に _ に置換されます。例: {appName}'
            fullWidth
          />
        </div>
      </PluginFormSection>
    </div>
  );
};

const StyledComponent = styled(Component)`
  padding: 0 16px;
  > div {
    padding: 8px 8px 8px 16px;
    > h3 {
      font-weight: 500;
      margin-bottom: 16px;
    }
  }
  .switches {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .file-name-section {
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .target-select {
    margin-top: 12px;
    max-width: 480px;
    width: 100%;
  }
`;

export default StyledComponent;
