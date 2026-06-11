import { JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import React, { type FC } from 'react';
import { getCommonPropertyState } from '@/config/states/plugin';
import { t } from '@/lib/i18n';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle>{t('config.common.showResult.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.common.showResult.description')}
      </PluginFormDescription>
      <JotaiSwitch
        atom={getCommonPropertyState('showResult')}
        label={t('config.common.showResult.label')}
      />
    </PluginFormSection>
  </div>
);

export default Component;
