import { JotaiNumber, JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import {
  collapsesEmptyRowsAtom,
  notifiesMissingRequiredFieldsAtom,
  remembersSelectedTabAtom,
  tabWidthAtom,
} from '@/config/states/plugin';
import { DEFAULT_TAB_WIDTH, MAX_TAB_WIDTH, MIN_TAB_WIDTH } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { BulkEdit } from './bulk-edit';

/**
 * 共通設定タブの内容です
 *
 * 全てのタブに共通で適用される設定を扱います
 */
export default function CommonSettings() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.bulkEdit.title')}</PluginFormTitle>
        <PluginFormDescription>{t('config.common.bulkEdit.description')}</PluginFormDescription>
        <PluginFormDescription last>{t('config.common.bulkEdit.hint')}</PluginFormDescription>
        <BulkEdit />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.common.description')}</PluginFormDescription>
        <JotaiNumber
          atom={tabWidthAtom}
          label={t('config.common.tabWidth.label')}
          helperText={t(
            'config.common.tabWidth.helper',
            String(MIN_TAB_WIDTH),
            String(MAX_TAB_WIDTH),
            String(DEFAULT_TAB_WIDTH)
          )}
          allowDecimal={false}
          allowNegative={false}
          width={240}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.remembersSelectedTab.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.common.remembersSelectedTab.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={remembersSelectedTabAtom}
          label={t('config.common.remembersSelectedTab.label')}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.notifiesMissingRequiredFields.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.common.notifiesMissingRequiredFields.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={notifiesMissingRequiredFieldsAtom}
          label={t('config.common.notifiesMissingRequiredFields.label')}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.common.collapsesEmptyRows.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.common.collapsesEmptyRows.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={collapsesEmptyRowsAtom}
          label={t('config.common.collapsesEmptyRows.label')}
        />
      </PluginFormSection>
    </div>
  );
}
