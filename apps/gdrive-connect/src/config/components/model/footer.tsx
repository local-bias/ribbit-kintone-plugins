import { ConfigFooter } from '@repo/plugin/react';
import {
  exportPluginConfigAtom,
  handlePluginConfigResetAtom,
  importPluginConfigAtom,
  updatePluginConfig,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';

export default function Footer() {
  return (
    <ConfigFooter
      t={t}
      resetAtom={handlePluginConfigResetAtom}
      exportAtom={exportPluginConfigAtom}
      importAtom={importPluginConfigAtom}
      updateAtom={updatePluginConfig}
    />
  );
}
