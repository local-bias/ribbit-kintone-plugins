import { ConfigFooter } from '@repo/plugin/react';
import { importConfigAtom, saveConfigAtom } from '@/config/states/ai';
import { exportPluginConfigAtom, handlePluginConfigResetAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';

export default function Footer() {
  return (
    <ConfigFooter
      t={t}
      resetAtom={handlePluginConfigResetAtom}
      exportAtom={exportPluginConfigAtom}
      importAtom={importConfigAtom}
      updateAtom={saveConfigAtom}
    />
  );
}
