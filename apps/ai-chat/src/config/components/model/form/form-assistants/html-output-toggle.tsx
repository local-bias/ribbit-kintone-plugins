import { conditionAllowHtmlOutputAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { PluginFormDescription, PluginFormTitle } from '@konomi-app/kintone-utilities-react';
import { Switch } from '@mui/material';
import { useAtom } from 'jotai';

export default function HtmlOutputToggle() {
  const [allowHtmlOutput, setAllowHtmlOutput] = useAtom(conditionAllowHtmlOutputAtom);

  return (
    <>
      <PluginFormTitle>{t('htmlOutput.label')}</PluginFormTitle>
      <PluginFormDescription>{t('htmlOutput.enable.description')}</PluginFormDescription>
      <Switch checked={allowHtmlOutput} onChange={(e) => setAllowHtmlOutput(e.target.checked)} />
    </>
  );
}
