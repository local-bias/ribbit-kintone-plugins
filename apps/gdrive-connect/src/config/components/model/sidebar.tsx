import { ConfigSidebar } from '@repo/plugin/react';
import { type FC, useCallback } from 'react';
import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewCondition, isPluginConditionMet } from '@/lib/plugin';
import type { PluginCondition } from '@/schema/plugin-config';

const Sidebar: FC = () => {
  const label = useCallback((params: { condition: PluginCondition; index: number }) => {
    const { condition, index } = params;
    return (
      <div>
        <div className='text-[11px] leading-4 text-gray-400'>{`${t('common.config.sidebar.tab.label')}${index + 1}`}</div>
        <div>{condition.memo || t('common.config.sidebar.tab.defaultLabel')}</div>
      </div>
    );
  }, []);

  return (
    <ConfigSidebar
      t={t}
      pluginConditionsAtom={pluginConditionsAtom}
      selectedConditionIdAtom={selectedConditionIdAtom}
      getNewCondition={getNewCondition}
      isPluginConditionMet={isPluginConditionMet}
      labelComponent={label}
    />
  );
};

export default Sidebar;
