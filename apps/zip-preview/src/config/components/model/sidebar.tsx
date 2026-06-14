import { ConfigSidebar } from '@repo/plugin/react';
import type { FC } from 'react';
import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewCondition, isPluginConditionMet } from '@/lib/plugin';

const Sidebar: FC = () => {
  return (
    <ConfigSidebar
      t={t}
      pluginConditionsAtom={pluginConditionsAtom}
      selectedConditionIdAtom={selectedConditionIdAtom}
      getNewCondition={getNewCondition}
      isPluginConditionMet={isPluginConditionMet}
    />
  );
};

export default Sidebar;
