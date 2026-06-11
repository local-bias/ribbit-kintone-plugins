import { PluginConditionAppendButton } from '@konomi-app/kintone-utilities-react';
import { useSetAtom } from '@repo/jotai';
import { produce } from 'immer';
import { type FC, memo } from 'react';
import { getNewCondition } from '@/lib/plugin';
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
