import { isConditionIdUnselectedAtom, getConditionPropertyAtom } from '@/config/states/plugin';
import {
  categoryFieldsAtom,
  categorySortFieldsAtom,
  colorFieldsAtom,
  customViewsAtom,
  dateFieldsAtom,
  numberFieldsAtom,
  titleFieldsAtom,
  userFieldsAtom,
} from '@/config/states/kintone';
import { t } from '@/lib/i18n';
import { GanttScale } from '@/schema/plugin-config';
import { JotaiFieldSelect, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { MenuItem, Skeleton, TextField } from '@mui/material';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ChangeEventHandler, FC, Suspense } from 'react';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';

const viewIdAtom = getConditionPropertyAtom('viewId');
const titleFieldCodeAtom = getConditionPropertyAtom('titleFieldCode');
const startDateFieldCodeAtom = getConditionPropertyAtom('startDateFieldCode');
const endDateFieldCodeAtom = getConditionPropertyAtom('endDateFieldCode');
const assigneeFieldCodeAtom = getConditionPropertyAtom('assigneeFieldCode');
const categoryFieldCodeAtom = getConditionPropertyAtom('categoryFieldCode');
const progressFieldCodeAtom = getConditionPropertyAtom('progressFieldCode');
const colorFieldCodeAtom = getConditionPropertyAtom('colorFieldCode');
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
const handleCategoryFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(categoryFieldCodeAtom, value);
});
const handleProgressFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(progressFieldCodeAtom, value);
});
const handleColorFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(colorFieldCodeAtom, value);
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

const CategoryFieldSelect: FC = () => {
  const fieldCode = useAtomValue(categoryFieldCodeAtom);
  const onChange = useSetAtom(handleCategoryFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={categoryFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.categoryFieldCode.label')}
      placeholder={t('config.condition.fieldPlaceholder')}
    />
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

const ColorFieldSelect: FC = () => {
  const fieldCode = useAtomValue(colorFieldCodeAtom);
  const onChange = useSetAtom(handleColorFieldCodeChangeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={colorFieldsAtom}
      fieldCode={fieldCode}
      onChange={onChange}
      label={t('config.condition.colorFieldCode.label')}
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
      {/* <PluginFormSection>
        <PluginFormTitle>メモ</PluginFormTitle>
        <PluginFormDescription last>この条件の識別用メモを入力してください。</PluginFormDescription>
        <JotaiText atom={getConditionPropertyAtom('memo')} />
      </PluginFormSection> */}
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
        <PluginFormTitle>{t('config.form.section.optional')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.form.description.optional')}</PluginFormDescription>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Suspense fallback={<FieldSelectFallback />}>
            <AssigneeFieldSelect />
          </Suspense>
          <Suspense fallback={<FieldSelectFallback />}>
            <CategoryFieldSelect />
          </Suspense>
          <Suspense fallback={<FieldSelectFallback />}>
            <ProgressFieldSelect />
          </Suspense>
          {/* <Suspense fallback={<FieldSelectFallback />}>
            <ColorFieldSelect />
          </Suspense> */}
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
