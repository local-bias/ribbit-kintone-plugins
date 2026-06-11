import { JotaiSwitch, QueryBuilder } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import { useAtomValue } from '@repo/jotai';
import { type FC, useState } from 'react';
import { bindableAppFieldsAtom, dstAppFieldsState } from '@/config/states/kintone';
import {
  deleteRelatedRecordsAtom,
  dstQueryAtom,
  isConditionIdUnselectedAtom,
  srcQueryAtom,
} from '@/config/states/plugin';
import { LANGUAGE } from '@/lib/global';
import { t } from '@/lib/i18n';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import FormBindings from './form-bindings';
import FormCreateIfNotExists from './form-create-if-not-exists';
import FormDstApp from './form-dst-app';
import FormKeyFieldCode from './form-key-field-code';
import FormSrcConditions from './form-src-conditions';
import FormTriggerEvents from './form-trigger-events';

const SrcConditionSection: FC = () => {
  const [tab, setTab] = useState<0 | 1>(0);

  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.condition.srcQuery.title')}</PluginFormTitle>
      <PluginFormDescription last>
        {t('config.condition.srcConditions.priorityDescription')}
      </PluginFormDescription>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('config.condition.srcConditions.tab.modern')} value={0} />
        <Tab label={t('config.condition.srcConditions.tab.legacy')} value={1} />
      </Tabs>
      {tab === 0 && (
        <>
          <PluginFormDescription last>
            {t('config.condition.srcConditions.modernDescription')}
          </PluginFormDescription>
          <FormSrcConditions />
        </>
      )}
      {tab === 1 && (
        <>
          <PluginFormDescription last>
            {t('config.condition.srcConditions.legacyDescription')}
          </PluginFormDescription>
          <QueryBuilder
            queryAtom={srcQueryAtom}
            fieldsAtom={bindableAppFieldsAtom}
            locale={LANGUAGE}
          />
        </>
      )}
    </PluginFormSection>
  );
};

const Component: FC = () => {
  const deleteRelatedRecords = useAtomValue(deleteRelatedRecordsAtom);

  return (
    <div className='p-4'>
      <FormTriggerEvents />
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.dstAppId.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.dstAppId.description')}
        </PluginFormDescription>
        <FormDstApp />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.keyFieldCode.title')}</PluginFormTitle>
        <PluginFormDescription>
          {t('config.condition.keyFieldCode.description1')}
        </PluginFormDescription>
        <PluginFormDescription last>
          <span className='text-red-500'>{t('config.condition.keyFieldCode.description2')}</span>
        </PluginFormDescription>
        <FormKeyFieldCode />
        <FormCreateIfNotExists />
        <div className='mt-4'>
          <Tooltip title='この機能はアプリ間連携プラグイン プラスでのみ利用可能です'>
            <span>
              <JotaiSwitch
                label={t('config.condition.deleteRelatedRecords.label')}
                atom={deleteRelatedRecordsAtom}
                disabled
              />
            </span>
          </Tooltip>
        </div>
      </PluginFormSection>
      {!deleteRelatedRecords && (
        <PluginFormSection>
          <PluginFormTitle>{t('config.condition.bindings.title')}</PluginFormTitle>
          <PluginFormDescription last>
            {t('config.condition.bindings.description')}
          </PluginFormDescription>
          <FormBindings />
        </PluginFormSection>
      )}
      <SrcConditionSection />
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.dstQuery.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.dstQuery.builderDescription')}
        </PluginFormDescription>
        <QueryBuilder queryAtom={dstQueryAtom} fieldsAtom={dstAppFieldsState} locale={LANGUAGE} />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const Container: FC = () => {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <Component />;
};

export default Container;
