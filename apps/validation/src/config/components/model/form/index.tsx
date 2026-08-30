import { JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from '@repo/jotai';
import type { FC } from 'react';
import { getConditionPropertyAtom, isConditionIdUnselectedAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import FormApplyConditions from './form-apply-conditions';
import FieldCodeForm from './form-fieldcode';
import ValidationRulesForm from './form-rules';
import TargetEventsForm from './form-target-events';

const FormContent: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.fieldCode.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.fieldCode.description')}
        </PluginFormDescription>
        <FieldCodeForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.targetEvents.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.targetEvents.description')}
        </PluginFormDescription>
        <TargetEventsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.applyConditions.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.applyConditions.description')}
        </PluginFormDescription>
        <FormApplyConditions />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.showErrorOnChange.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.showErrorOnChange.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={getConditionPropertyAtom('showErrorOnChange')}
          label={t('config.condition.showErrorOnChange.label')}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.rules.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.rules.description')}
        </PluginFormDescription>
        <ValidationRulesForm />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
