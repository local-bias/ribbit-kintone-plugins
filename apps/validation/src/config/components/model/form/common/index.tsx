import { JotaiSwitch, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from '@repo/jotai';
import type { FC } from 'react';
import {
  csvImportButtonLabelAtom,
  csvImportEnabledAtom,
  recordErrorHeadingAtom,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';

const CommonSettings: FC = () => {
  const csvImportEnabled = useAtomValue(csvImportEnabledAtom);
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.recordErrorHeading.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.common.recordErrorHeading.description')}
        </PluginFormDescription>
        <JotaiText
          atom={recordErrorHeadingAtom}
          placeholder={t('desktop.error.recordHeading')}
          sx={{ width: '100%' }}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.csvImport.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.common.csvImport.description')}
        </PluginFormDescription>
        <JotaiSwitch atom={csvImportEnabledAtom} label={t('config.common.csvImport.label')} />
      </PluginFormSection>
      {csvImportEnabled && (
        <PluginFormSection>
          <PluginFormTitle>{t('config.common.csvImport.buttonLabel.title')}</PluginFormTitle>
          <PluginFormDescription last>
            {t('config.common.csvImport.buttonLabel.description')}
          </PluginFormDescription>
          <JotaiText atom={csvImportButtonLabelAtom} placeholder={t('csv.button.defaultLabel')} />
        </PluginFormSection>
      )}
    </div>
  );
};

export default CommonSettings;
