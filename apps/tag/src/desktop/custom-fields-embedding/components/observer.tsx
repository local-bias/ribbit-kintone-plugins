import { FC, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { getCurrentRecord, setCurrentRecord } from '@konomi-app/kintone-utilities';
import { pluginConditionAtom, tagDataAtom } from '../states/plugin';

const Component: FC = () => {
  const condition = useAtomValue(pluginConditionAtom);
  const tagData = useAtomValue(tagDataAtom);

  useEffect(() => {
    if (!condition) {
      return;
    }

    try {
      const { record } = getCurrentRecord();

      const field = record[condition.configField];
      if (!field) {
        return;
      }

      field.value = JSON.stringify(tagData);

      setCurrentRecord({ record });
    } catch (error) {
      console.error(error);
    }
  }, [condition, tagData]);

  return null;
};

export default Component;
