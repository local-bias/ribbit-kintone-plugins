import { JotaiText } from '@/components/jotai';
import { commonSettingsShownAtom, getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';

const FormContent: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.memo.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.condition.memo.description')}</PluginFormDescription>
        <JotaiText
          atom={getConditionPropertyAtom('targetSpaceId')}
          label={t('config.condition.memo.label')}
          placeholder={t('config.condition.memo.placeholder')}
        />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(commonSettingsShownAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
