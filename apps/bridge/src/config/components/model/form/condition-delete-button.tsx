import { PluginConditionDeleteButton } from '@konomi-app/kintone-utilities-react';
import { toast } from '@konomi-app/ui';
import { produce } from 'immer';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo } from 'react';
import { selectedConditionIdState, pluginConfigAtom } from '../../../states/plugin';

const Container: FC = () => {
  const storage = useAtomValue(pluginConfigAtom);
  const selectedConditionId = useAtomValue(selectedConditionIdState);
  const setStorage = useSetAtom(pluginConfigAtom);
  const setSelectedConditionId = useSetAtom(selectedConditionIdState);

  const onClick = () => {
    setStorage((current) =>
      produce(current, (draft) => {
        const index = draft.conditions.findIndex(
          (condition) => condition.id === selectedConditionId
        );
        if (index !== -1) {
          draft.conditions.splice(index, 1);
        }
      })
    );
    setSelectedConditionId(null);
    toast.success('設定を削除しました');
  };

  if ((storage?.conditions.length ?? 0) < 2) {
    return null;
  }

  return <PluginConditionDeleteButton {...{ onClick }} />;
};

export default memo(Container);
