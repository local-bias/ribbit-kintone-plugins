import React, { FC } from 'react';

import {
  PluginFormSection,
  PluginFormTitle,
  PluginFormDescription,
  RecoilNumber,
} from '@konomi-app/kintone-utilities-react';
import FieldsForm from './form-target-field';
import SrcFieldCodeForm from './form-src-field';
import DeleteButton from './condition-delete-button';
import SrcAppIdForm from './form-src-app';
import { t } from '@/lib/i18n';
import { getConditionPropertyState } from '@/config/states/plugin';

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
      <RecoilNumber state={getConditionPropertyState('limit')} />
    </PluginFormSection>
    <DeleteButton />
  </div>
);

export default Component;
