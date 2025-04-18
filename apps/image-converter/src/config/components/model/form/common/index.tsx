import { t } from '@/lib/i18n';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FC } from 'react';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.memo.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.common.memo.description')}</PluginFormDescription>
    </PluginFormSection>
  </div>
);

export default Component;
