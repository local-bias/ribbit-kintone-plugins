import { JotaiFieldMultiSelect, JotaiRadio, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtom, useAtomValue } from '@repo/jotai';
import {
  currentAppFieldsAtom,
  currentAppGroupCodesAtom,
  currentAppHrElementIdsAtom,
  currentAppLabelKeysAtom,
  currentAppSpacerElementIdsAtom,
  cybozuGroupsAtom,
  cybozuOrganizationsAtom,
  cybozuUsersAtom,
} from '@/config/states/kintone';
import {
  fieldDisplayModeAtom,
  fieldsAtom,
  groupDisplayModeAtom,
  groupsAtom,
  hrDisplayModeAtom,
  hrsAtom,
  isConditionIdUnselectedAtom,
  labelDisplayModeAtom,
  labelsAtom,
  spaceDisplayModeAtom,
  spaceIdsAtom,
  tabNameAtom,
  viewerGroupsAtom,
  viewerOrganizationsAtom,
  viewerUsersAtom,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import type { DisplayMode } from '@/schema/plugin-config';
import { AsyncFormField } from './async-form-field';
import CommonSettings from './common';
import ConditionDeleteButton from './condition-delete-button';
import { DisplayConditionLogicSelect, DisplayConditionsInput } from './display-conditions';
import { EntityMultiSelect } from './entity-multi-select';
import { ScreensSelect } from './screens-select';
import { StatusSelect } from './status-select';
import { StringMultiSelect } from './string-multi-select';

type DisplayModeOptions = { label: string; value: DisplayMode }[];

const FIELD_MODE_OPTIONS: DisplayModeOptions = [
  { label: t('config.condition.fields.mode.add'), value: 'add' },
  { label: t('config.condition.fields.mode.sub'), value: 'sub' },
];
const GROUP_MODE_OPTIONS: DisplayModeOptions = [
  { label: t('config.condition.groups.mode.add'), value: 'add' },
  { label: t('config.condition.groups.mode.sub'), value: 'sub' },
];
const SPACE_MODE_OPTIONS: DisplayModeOptions = [
  { label: t('config.condition.spaces.mode.add'), value: 'add' },
  { label: t('config.condition.spaces.mode.sub'), value: 'sub' },
];
const LABEL_MODE_OPTIONS: DisplayModeOptions = [
  { label: t('config.condition.labels.mode.add'), value: 'add' },
  { label: t('config.condition.labels.mode.sub'), value: 'sub' },
];
const HR_MODE_OPTIONS: DisplayModeOptions = [
  { label: t('config.condition.hr.mode.add'), value: 'add' },
  { label: t('config.condition.hr.mode.sub'), value: 'sub' },
];

function FieldsSelect() {
  const displayMode = useAtomValue(fieldDisplayModeAtom);
  const [fields, setFields] = useAtom(fieldsAtom);
  const label = t(`config.condition.fields.label.${displayMode}`);

  return (
    <AsyncFormField label={label}>
      <JotaiFieldMultiSelect
        fieldPropertiesAtom={currentAppFieldsAtom}
        fieldCodes={fields}
        onChange={setFields}
        label={label}
        placeholder={t('config.condition.fields.placeholder')}
        sx={{ width: 480, maxWidth: '100%' }}
      />
    </AsyncFormField>
  );
}

function GroupsSelect() {
  const displayMode = useAtomValue(groupDisplayModeAtom);
  const label = t(`config.condition.groups.label.${displayMode}`);

  return (
    <AsyncFormField label={label}>
      <StringMultiSelect
        valuesAtom={groupsAtom}
        optionsAtom={currentAppGroupCodesAtom}
        label={label}
        placeholder={t('config.condition.groups.placeholder')}
        noOptionsText={t('config.condition.groups.empty')}
      />
    </AsyncFormField>
  );
}

function SpacesSelect() {
  const displayMode = useAtomValue(spaceDisplayModeAtom);
  const label = t(`config.condition.spaces.label.${displayMode}`);

  return (
    <AsyncFormField label={label}>
      <StringMultiSelect
        valuesAtom={spaceIdsAtom}
        optionsAtom={currentAppSpacerElementIdsAtom}
        label={label}
        placeholder={t('config.condition.spaces.placeholder')}
        noOptionsText={t('config.condition.spaces.empty')}
      />
    </AsyncFormField>
  );
}

function LabelsSelect() {
  const displayMode = useAtomValue(labelDisplayModeAtom);
  const label = t(`config.condition.labels.label.${displayMode}`);

  return (
    <AsyncFormField label={label}>
      <StringMultiSelect
        freeSolo
        valuesAtom={labelsAtom}
        optionsAtom={currentAppLabelKeysAtom}
        label={label}
        placeholder={t('config.condition.labels.placeholder')}
        noOptionsText={t('config.condition.labels.empty')}
      />
    </AsyncFormField>
  );
}

function HrsSelect() {
  const displayMode = useAtomValue(hrDisplayModeAtom);
  const label = t(`config.condition.hr.label.${displayMode}`);

  return (
    <AsyncFormField label={label}>
      <StringMultiSelect
        valuesAtom={hrsAtom}
        optionsAtom={currentAppHrElementIdsAtom}
        label={label}
        placeholder={t('config.condition.hr.placeholder')}
        noOptionsText={t('config.condition.hr.empty')}
      />
    </AsyncFormField>
  );
}

function ViewerSelect() {
  return (
    <div className='grid gap-4'>
      <AsyncFormField label={t('config.condition.viewers.users')}>
        <EntityMultiSelect
          valuesAtom={viewerUsersAtom}
          optionsAtom={cybozuUsersAtom}
          label={t('config.condition.viewers.users')}
        />
      </AsyncFormField>
      <AsyncFormField label={t('config.condition.viewers.groups')}>
        <EntityMultiSelect
          valuesAtom={viewerGroupsAtom}
          optionsAtom={cybozuGroupsAtom}
          label={t('config.condition.viewers.groups')}
        />
      </AsyncFormField>
      <AsyncFormField label={t('config.condition.viewers.organizations')}>
        <EntityMultiSelect
          valuesAtom={viewerOrganizationsAtom}
          optionsAtom={cybozuOrganizationsAtom}
          label={t('config.condition.viewers.organizations')}
        />
      </AsyncFormField>
    </div>
  );
}

function ConditionForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.tab.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.condition.tab.description')}</PluginFormDescription>
        <JotaiText atom={tabNameAtom} label={t('config.condition.tab.label')} />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.fields.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.fields.description')}
        </PluginFormDescription>
        <div className='grid gap-4'>
          <JotaiRadio atom={fieldDisplayModeAtom} options={FIELD_MODE_OPTIONS} />
          <FieldsSelect />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.groups.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.condition.groups.description')}</PluginFormDescription>
        <PluginFormDescription last>
          <span className='text-red-500'>{t('config.condition.groups.caution')}</span>
        </PluginFormDescription>
        <div className='grid gap-4'>
          <JotaiRadio atom={groupDisplayModeAtom} options={GROUP_MODE_OPTIONS} />
          <GroupsSelect />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.spaces.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.spaces.description')}
        </PluginFormDescription>
        <div className='grid gap-4'>
          <JotaiRadio atom={spaceDisplayModeAtom} options={SPACE_MODE_OPTIONS} />
          <SpacesSelect />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.labels.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.condition.labels.description')}</PluginFormDescription>
        <PluginFormDescription last>
          <span className='text-red-500'>{t('config.condition.labels.caution')}</span>
        </PluginFormDescription>
        <div className='grid gap-4'>
          <JotaiRadio atom={labelDisplayModeAtom} options={LABEL_MODE_OPTIONS} />
          <LabelsSelect />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.hr.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.condition.hr.description')}</PluginFormDescription>
        <PluginFormDescription last>{t('config.condition.hr.hint')}</PluginFormDescription>
        <div className='grid gap-4'>
          <JotaiRadio atom={hrDisplayModeAtom} options={HR_MODE_OPTIONS} />
          <HrsSelect />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.screens.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.screens.description')}
        </PluginFormDescription>
        <ScreensSelect />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.displayConditions.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.displayConditions.description')}
        </PluginFormDescription>
        <div className='grid gap-4'>
          <DisplayConditionLogicSelect />
          <AsyncFormField label={t('config.condition.displayConditions.title')} width={560}>
            <DisplayConditionsInput />
          </AsyncFormField>
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.viewers.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.condition.viewers.description')}</PluginFormDescription>
        <PluginFormDescription last>
          <span className='text-red-500'>{t('config.condition.viewers.caution')}</span>
        </PluginFormDescription>
        <ViewerSelect />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.statuses.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.statuses.description')}
        </PluginFormDescription>
        <AsyncFormField label={t('config.condition.statuses.label')}>
          <StatusSelect />
        </AsyncFormField>
      </PluginFormSection>
      <ConditionDeleteButton />
    </div>
  );
}

export default function PluginForm() {
  const isCommonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return isCommonSettingsShown ? <CommonSettings /> : <ConditionForm />;
}
