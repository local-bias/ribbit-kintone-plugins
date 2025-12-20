import { PluginConditionTabs } from '@konomi-app/kintone-utilities-react';
import { Tab } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, useEffect } from 'react';
import { pluginConditionsAtom, selectedConditionIdAtom, tabIndexAtom } from '../../../states/plugin';

const Component: FC = () => {
  const tabIndex = useAtomValue(tabIndexAtom);
  const setTabIndex = useSetAtom(tabIndexAtom);
  const selectedConditionId = useAtomValue(selectedConditionIdAtom);
  const setSelectedConditionId = useSetAtom(selectedConditionIdAtom);
  const conditions = useAtomValue(pluginConditionsAtom);

  useEffect(() => {
    if (conditions.length > 0 && !selectedConditionId) {
      const condition = conditions[tabIndex] || conditions[0];
      if (condition) {
        setSelectedConditionId(condition.id);
      }
    }
  }, [conditions, selectedConditionId, tabIndex, setSelectedConditionId]);

  const onTabChange = (_: any, index: number) => {
    setTabIndex(index);
    setSelectedConditionId(conditions[index]?.id ?? null);
  };

  return (
    <PluginConditionTabs tabIndex={tabIndex} onChange={onTabChange}>
      {conditions.map((condition, i) => (
        <Tab
          label={`設定${i + 1}${condition.targetField ? `(${condition.targetField})` : ''}`}
          key={i}
        />
      ))}
    </PluginConditionTabs>
  );
};

export default Component;
