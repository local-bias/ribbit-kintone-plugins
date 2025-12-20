import { PluginConditionDeleteButton } from '@konomi-app/kintone-utilities-react';
import { produce } from 'immer';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FC, memo } from 'react';
import { pluginConditionsAtom, pluginConfigAtom, tabIndexAtom } from '../../../states/plugin';

const Container: FC = () => {
  const setPluginConfig = useSetAtom(pluginConfigAtom);
  const [tabIndex, setTabIndex] = useAtom(tabIndexAtom);
  const conditions = useAtomValue(pluginConditionsAtom);

  const onClick = async () => {
    setPluginConfig((current) =>
      produce(current, (draft) => {
        draft.conditions.splice(tabIndex, 1);
      })
    );
    setTabIndex((i: number) => (i === 0 ? i : i - 1));
  };

  if (conditions.length < 2) {
    return null;
  }

  return <PluginConditionDeleteButton {...{ onClick }} />;
};

export default memo(Container);
