import {
  basisTypeAtom,
  isBulkUpdateButtonVisibleAtom,
  isTargetFieldDisabledAtom,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { BASIS_TYPES } from '@/lib/plugin';
import { JotaiRadio, JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import DeleteButton from './condition-delete-button';
import AdjustmentsForm from './form-adjustments';
import BasisFieldCodeForm from './form-basis-field-code';
import TargetFieldCodeForm from './form-target-field-code';

export default function ConditionForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.targetFieldCode.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.targetFieldCode.description')}
        </PluginFormDescription>
        <div className='flex flex-col gap-4'>
          <TargetFieldCodeForm />
          <JotaiSwitch
            atom={isTargetFieldDisabledAtom}
            label={t('config.condition.isTargetFieldDisabled.label')}
          />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.basisType.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.basisType.description')}
        </PluginFormDescription>
        <JotaiRadio options={BASIS_TYPES} atom={basisTypeAtom} />
      </PluginFormSection>
      <BasisFieldCodeForm />
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.adjustments.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.adjustments.description')}
        </PluginFormDescription>
        <AdjustmentsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.bulkUpdate.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.bulkUpdate.description')}
        </PluginFormDescription>
        <div className='flex flex-col gap-4'>
          <JotaiSwitch
            atom={isBulkUpdateButtonVisibleAtom}
            label={t('config.condition.isBulkUpdateButtonVisible.label')}
          />
        </div>
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
}
