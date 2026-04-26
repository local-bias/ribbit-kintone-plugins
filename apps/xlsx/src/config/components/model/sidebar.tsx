import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { useAtom } from 'jotai';
import { type FC, useCallback } from 'react';
import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewCondition, isPluginConditionMet } from '@/lib/plugin';
import type { PluginCondition } from '@/schema/plugin-config';

const SidebarLabel: FC<{ condition: PluginCondition; index: number }> = ({ condition, index }) => {
  const label =
    condition.fileNameTemplate ||
    condition.sheetName ||
    t('common.config.sidebar.tab.defaultLabel');
  return (
    <div>
      <div className='text-[11px] leading-4 text-gray-400'>{`${t('common.config.sidebar.tab.label')}${index + 1}`}</div>
      <div>{label}</div>
    </div>
  );
};

const Sidebar: FC = () => {
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);

  const label = useCallback(
    ({ condition, index }: { condition: PluginCondition; index: number }) => (
      <SidebarLabel condition={condition} index={index} />
    ),
    []
  );

  return (
    <BundledSidebar
      conditions={conditions}
      setConditions={setConditions}
      getNewCondition={getNewCondition}
      labelComponent={label}
      onSelectedConditionChange={(condition) => setSelectedConditionId(condition?.id ?? null)}
      selectedConditionId={selectedConditionId}
      context={{
        onCopy: () => {},
        onPaste: () => null,
        onPasteValidation: (condition) => isPluginConditionMet(condition),
        onPasteValidationError: () => {},
      }}
    />
  );
};

export default Sidebar;
