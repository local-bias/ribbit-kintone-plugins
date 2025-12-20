import { produce } from 'immer';
import { useSetAtom } from 'jotai';
import { FC, memo } from 'react';

import { getNewCondition } from '@/lib/plugin';
import { PluginConditionAppendButton } from '@konomi-app/kintone-utilities-react';
import { pluginConfigAtom } from '../../../states/plugin';

const Container: FC = () => {
  const setPluginConfig = useSetAtom(pluginConfigAtom);

  const addCondition = () => {
    setPluginConfig((current) =>
      produce(current, (draft) => {
        draft.conditions.push(getNewCondition());
      })
    );
  };

  return <PluginConditionAppendButton onClick={addCondition} />;
};

export default memo(Container);
