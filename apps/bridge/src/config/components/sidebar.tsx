import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewCondition } from '@/lib/plugin';
import { PluginCondition } from '@/schema/plugin-config';
import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import { useAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';
import { kintoneAppsState } from '../states/kintone';

function Sidebar() {
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);
  const label = useCallback((params: { condition: PluginCondition; index: number }) => {
    const { condition, index } = params;
    const allApps = useAtomValue(kintoneAppsState);
    const targetApp = allApps.find((app) => app.appId === condition.dstAppId);
    return (
      <div>
        <div style={{ fontSize: '11px', lineHeight: '16px', color: '#9ca3af' }}>
          {`${t('common.config.sidebar.tab.label')}${index + 1}`}
        </div>
        <div>
          {targetApp?.name || condition.dstAppId || t('common.config.sidebar.tab.defaultLabel')}
        </div>
      </div>
    );
  }, []);

  const onSelectedConditionChange = (condition: PluginCondition | null) => {
    setSelectedConditionId(condition?.id ?? null);
  };

  const onConditionDelete = () => {
    toast.success(t('common.config.toast.onConditionDelete'));
  };

  return (
    <BundledSidebar
      conditions={conditions}
      setConditions={setConditions}
      getNewCondition={getNewCondition}
      labelComponent={label}
      onSelectedConditionChange={onSelectedConditionChange}
      selectedConditionId={selectedConditionId}
      commonTab
      onConditionDelete={onConditionDelete}
      context={{
        onCopy: () => {
          toast.success(t('common.config.sidebar.context.onCopy'));
        },
        onPaste: () => {
          toast.success(t('common.config.sidebar.context.onPaste'));
          return null;
        },
        onPasteValidation: (condition) => true, // WIP
        onPasteValidationError: () => {
          toast.error(t('common.config.sidebar.context.onPasteFailure'));
        },
      }}
    />
  );
}

export default Sidebar;
