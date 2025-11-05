import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { JotaiNumber } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FC } from 'react';
import DeleteButton from './condition-delete-button';
import SrcAppIdForm from './form-src-app';
import SrcFieldCodeForm from './form-src-field';
import FieldsForm from './form-target-field';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.targetFieldCode.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.condition.targetFieldCode.description')}
      </PluginFormDescription>
      <FieldsForm />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.srcAppId.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.condition.srcAppId.description')}
      </PluginFormDescription>
      <SrcAppIdForm />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.srcFieldCode.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.condition.srcFieldCode.description')}
      </PluginFormDescription>
      <SrcFieldCodeForm />
    </PluginFormSection>
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.limit.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.condition.limit.description')}</PluginFormDescription>
      <JotaiNumber atom={getConditionPropertyAtom('limit')} />
    </PluginFormSection>
    <DeleteButton />
  </div>
);

export default Component;
