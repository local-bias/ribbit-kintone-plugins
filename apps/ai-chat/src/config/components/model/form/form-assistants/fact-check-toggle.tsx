import {
  conditionEnableFactCheckAtom,
  conditionEnableFactCheckLogAtom,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Switch } from '@mui/material';
import { useAtom } from 'jotai';

export default function FactCheckToggle() {
  const [enableFactCheck, setEnableFactCheck] = useAtom(conditionEnableFactCheckAtom);
  const [enableFactCheckLog, setEnableFactCheckLog] = useAtom(conditionEnableFactCheckLogAtom);

  return (
    <>
      <PluginFormTitle>{t('factCheck.label')}</PluginFormTitle>
      <PluginFormDescription>{t('factCheck.enable.custom')}</PluginFormDescription>
      <Switch checked={enableFactCheck} onChange={(e) => setEnableFactCheck(e.target.checked)} />

      {enableFactCheck && (
        <PluginFormSection>
          <PluginFormTitle>{t('factCheck.enableLog')}</PluginFormTitle>
          <PluginFormDescription>{t('factCheck.enableLog.description')}</PluginFormDescription>
          <Switch
            checked={enableFactCheckLog}
            onChange={(e) => setEnableFactCheckLog(e.target.checked)}
          />
        </PluginFormSection>
      )}
    </>
  );
}
