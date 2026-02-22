import {
  categorySortFieldsAtom,
  customViewsAtom,
  dateFieldsAtom,
  groupableFieldsAtom,
  numberFieldsAtom,
  titleFieldsAtom,
  userFieldsAtom,
} from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { CategorySetting, GanttScale } from '@/schema/plugin-config';
import styled from '@emotion/styled';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { MenuItem, Skeleton, TextField, Tooltip } from '@mui/material';
import { produce } from 'immer';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ChangeEventHandler, FC, Suspense, useCallback } from 'react';
import DeleteButton from './condition-delete-button';

const viewIdAtom = getConditionPropertyAtom('viewId');
const titleFieldCodeAtom = getConditionPropertyAtom('titleFieldCode');
const startDateFieldCodeAtom = getConditionPropertyAtom('startDateFieldCode');
const endDateFieldCodeAtom = getConditionPropertyAtom('endDateFieldCode');
const assigneeFieldCodeAtom = getConditionPropertyAtom('assigneeFieldCode');
const categoriesAtom = getConditionPropertyAtom('categories');
const progressFieldCodeAtom = getConditionPropertyAtom('progressFieldCode');
const categorySortFieldCodeAtom = getConditionPropertyAtom('categorySortFieldCode');
const defaultScaleAtom = getConditionPropertyAtom('defaultScale');

const handleTitleFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(titleFieldCodeAtom, value);
});
const handleStartDateFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(startDateFieldCodeAtom, value);
});
const handleEndDateFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(endDateFieldCodeAtom, value);
});
const handleAssigneeFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(assigneeFieldCodeAtom, value);
});
const handleProgressFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(progressFieldCodeAtom, value);
});
const handleCategorySortFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(categorySortFieldCodeAtom, value);
});

const ViewIdSelect: FC = () => {
  const views = useAtomValue(customViewsAtom);
  const [viewId, setViewId] = useAtom(viewIdAtom);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setViewId(e.target.value);
  };

  return (
    <TextField
      select
      label={t('config.condition.viewId.label')}
      value={viewId}
      onChange={onChange}
      sx={{ width: 250 }}
    >
      {Object.entries(views)
        .sort(([, a], [, b]) => Number(a.index) - Number(b.index))
        .map(([name, { id }], i) => (
          <MenuItem key={i} value={id}>
            {name}
          </MenuItem>
        ))}
    </TextField>
  );
};

const TitleFieldSelect: FC = () => {
  const fieldCode = useAtomValue(titleFieldCodeAtom);
  const onChange = useSetAtom(handleTitleFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={titleFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.titleFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
  );
};

const StartDateFieldSelect: FC = () => {
  const fieldCode = useAtomValue(startDateFieldCodeAtom);
  const onChange = useSetAtom(handleStartDateFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={dateFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.startDateFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
  );
};

const EndDateFieldSelect: FC = () => {
  const fieldCode = useAtomValue(endDateFieldCodeAtom);
  const onChange = useSetAtom(handleEndDateFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={dateFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.endDateFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
  );
};

const AssigneeFieldSelect: FC = () => {
  const fieldCode = useAtomValue(assigneeFieldCodeAtom);
  const onChange = useSetAtom(handleAssigneeFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={userFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.assigneeFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
  );
};

// ─── カテゴリ階層エディタ ────────────────────────────

const CategoryCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
  position: relative;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CategoryLevel = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: #555;
`;

const ColorSettingsWrapper = styled.div`
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background-color: #fff;
`;

const ColorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ColorSwatch = styled.input`
  width: 36px;
  height: 36px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 2px;
  cursor: pointer;
  background: none;
`;

const RemoveButton = styled.button`
  border: none;
  background: none;
  color: #d32f2f;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  line-height: 1;

  &:hover {
    color: #b71c1c;
  }
`;

const AddColorButton = styled.button`
  border: 1px dashed #bbb;
  background: none;
  color: #666;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;

  &:hover {
    background-color: #f5f5f5;
    border-color: #999;
  }
`;

const AddCategoryButton = styled.button<{ disabled?: boolean }>`
  border: 1px dashed #bbb;
  background: none;
  color: ${({ disabled }) => (disabled ? '#bbb' : '#666')};
  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  width: 100%;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};

  &:hover {
    background-color: ${({ disabled }) => (disabled ? 'none' : '#f5f5f5')};
    border-color: ${({ disabled }) => (disabled ? '#bbb' : '#999')};
  }
`;

const EnableColorLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  margin-top: 8px;
`;

/** 単一カテゴリエントリの編集コンポーネント */
const CategoryEntry: FC<{
  index: number;
  category: CategorySetting;
  onUpdate: (index: number, category: CategorySetting) => void;
  onRemove: (index: number) => void;
}> = ({ index, category, onUpdate, onRemove }) => {
  const handleFieldCodeChange = useCallback(
    (value: string) => {
      onUpdate(index, { ...category, fieldCode: value });
    },
    [index, category, onUpdate]
  );

  const handleToggleColor = useCallback(() => {
    if (category.colors.length > 0) {
      onUpdate(index, { ...category, colors: [] });
    } else {
      onUpdate(index, { ...category, colors: [{ value: '', color: '#4285F4' }] });
    }
  }, [index, category, onUpdate]);

  const handleAddColor = useCallback(() => {
    onUpdate(index, {
      ...category,
      colors: [...category.colors, { value: '', color: '#4285F4' }],
    });
  }, [index, category, onUpdate]);

  const handleUpdateColorValue = useCallback(
    (colorIndex: number, value: string) => {
      const newColors = [...category.colors];
      newColors[colorIndex] = { ...newColors[colorIndex]!, value };
      onUpdate(index, { ...category, colors: newColors });
    },
    [index, category, onUpdate]
  );

  const handleUpdateColor = useCallback(
    (colorIndex: number, color: string) => {
      const newColors = [...category.colors];
      newColors[colorIndex] = { ...newColors[colorIndex]!, color };
      onUpdate(index, { ...category, colors: newColors });
    },
    [index, category, onUpdate]
  );

  const handleRemoveColor = useCallback(
    (colorIndex: number) => {
      const newColors = category.colors.filter((_, i) => i !== colorIndex);
      onUpdate(index, { ...category, colors: newColors });
    },
    [index, category, onUpdate]
  );

  const hasColors = category.colors.length > 0;

  return (
    <CategoryCard>
      <CategoryHeader>
        <CategoryLevel>{t('config.categories.level', String(index + 1))}</CategoryLevel>
        <RemoveButton onClick={() => onRemove(index)} title={t('config.categories.removeCategory')}>
          ✕
        </RemoveButton>
      </CategoryHeader>
      <Suspense fallback={<Skeleton variant='rounded' width='100%' height={56} />}>
        <JotaiFieldSelect
          fieldPropertiesAtom={groupableFieldsAtom}
          fieldCode={category.fieldCode}
          onChange={handleFieldCodeChange}
          label={t('config.categories.fieldCode')}
          placeholder={t('config.categories.fieldPlaceholder')}
        />
      </Suspense>
      <EnableColorLabel>
        <input type='checkbox' checked={hasColors} onChange={handleToggleColor} />
        {t('config.categories.enableColor')}
      </EnableColorLabel>
      {hasColors && (
        <ColorSettingsWrapper>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>
            {t('config.categories.colorSettings')}
          </div>
          {category.colors.map((colorEntry, colorIndex) => (
            <ColorRow key={colorIndex}>
              <TextField
                size='small'
                label={t('config.categories.colorValue')}
                value={colorEntry.value}
                onChange={(e) => handleUpdateColorValue(colorIndex, e.target.value)}
                sx={{ flex: 1 }}
              />
              <ColorSwatch
                type='color'
                value={colorEntry.color}
                onChange={(e) => handleUpdateColor(colorIndex, e.target.value)}
                title={t('config.categories.colorPicker')}
              />
              <RemoveButton
                onClick={() => handleRemoveColor(colorIndex)}
                title={t('config.categories.removeColor')}
              >
                ✕
              </RemoveButton>
            </ColorRow>
          ))}
          <AddColorButton onClick={handleAddColor}>
            {t('config.categories.addColor')}
          </AddColorButton>
        </ColorSettingsWrapper>
      )}
    </CategoryCard>
  );
};

/** カテゴリ階層リストエディタ */
const CategoriesEditor: FC = () => {
  const [categories, setCategories] = useAtom(categoriesAtom);

  const handleUpdate = useCallback(
    (index: number, category: CategorySetting) => {
      setCategories(
        produce((draft: CategorySetting[]) => {
          draft[index] = category;
        })
      );
    },
    [setCategories]
  );

  const handleRemove = useCallback(
    (index: number) => {
      setCategories(
        produce((draft: CategorySetting[]) => {
          draft.splice(index, 1);
        })
      );
    },
    [setCategories]
  );

  const addDisabled = categories.length >= 1;

  const handleAdd = useCallback(() => {
    if (addDisabled) {
      return;
    }
    setCategories(
      produce((draft: CategorySetting[]) => {
        draft.push({ fieldCode: '', colors: [] });
      })
    );
  }, [setCategories, addDisabled]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {categories.map((category, index) => (
        <CategoryEntry
          key={index}
          index={index}
          category={category}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      ))}
      <Tooltip title={addDisabled ? t('config.categories.plusOnly') : ''} placement='top' arrow>
        <span style={{ width: '100%' }}>
          <AddCategoryButton onClick={handleAdd} disabled={addDisabled}>
            {t('config.categories.addCategory')}
          </AddCategoryButton>
        </span>
      </Tooltip>
    </div>
  );
};

const ProgressFieldSelect: FC = () => {
  const fieldCode = useAtomValue(progressFieldCodeAtom);
  const onChange = useSetAtom(handleProgressFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={numberFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.progressFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
  );
};

const CategorySortFieldSelect: FC = () => {
  const fieldCode = useAtomValue(categorySortFieldCodeAtom);
  const onChange = useSetAtom(handleCategorySortFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={categorySortFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.categorySortFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
  );
};

const DefaultScaleSelect: FC = () => {
  const [defaultScale, setDefaultScale] = useAtom(defaultScaleAtom);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setDefaultScale(e.target.value as GanttScale);
  };

  return (
    <TextField
      select
      label={t('config.condition.defaultScale.label')}
      value={defaultScale}
      onChange={onChange}
      sx={{ width: 250 }}
    >
      <MenuItem value='day'>{t('desktop.scale.day')}</MenuItem>
      <MenuItem value='week'>{t('desktop.scale.week')}</MenuItem>
      <MenuItem value='month'>{t('desktop.scale.month')}</MenuItem>
    </TextField>
  );
};

const FieldSelectFallback: FC = () => <Skeleton variant='rounded' width={400} height={56} />;

const FormContent: FC = () => {
  return (
    <div style={{ padding: 16 }}>
      <PluginFormSection>
        <PluginFormTitle>{t('config.form.section.basic')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.form.description.viewId')}</PluginFormDescription>
        <Suspense fallback={<FieldSelectFallback />}>
          <ViewIdSelect />
        </Suspense>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.form.section.fields')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.form.description.fields')}</PluginFormDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Suspense fallback={<FieldSelectFallback />}>
            <TitleFieldSelect />
          </Suspense>
          <Suspense fallback={<FieldSelectFallback />}>
            <StartDateFieldSelect />
          </Suspense>
          <Suspense fallback={<FieldSelectFallback />}>
            <EndDateFieldSelect />
          </Suspense>
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.form.section.categories')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.form.description.categories')}
        </PluginFormDescription>
        <CategoriesEditor />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.form.section.optional')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.form.description.optional')}</PluginFormDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Suspense fallback={<FieldSelectFallback />}>
            <AssigneeFieldSelect />
          </Suspense>
          <Suspense fallback={<FieldSelectFallback />}>
            <ProgressFieldSelect />
          </Suspense>
          <Suspense fallback={<FieldSelectFallback />}>
            <CategorySortFieldSelect />
          </Suspense>
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.form.section.display')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.form.description.defaultScale')}
        </PluginFormDescription>
        <DefaultScaleSelect />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  return <FormContent />;
};

export default FormContainer;
