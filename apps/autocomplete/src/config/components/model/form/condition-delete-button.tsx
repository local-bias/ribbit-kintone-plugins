import { PluginConditionDeleteButton } from '@konomi-app/kintone-utilities-react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import { enqueueSnackbar } from 'notistack';
import { FC, memo } from 'react';
import { pluginConditionsAtom, selectedConditionIdAtom } from '../../../states/plugin';

const handleConditionDeleteAtom = atom(null, (get, set) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConditionsAtom, (prev) =>
    prev.filter((condition) => condition.id !== selectedConditionId)
  );
  set(selectedConditionIdAtom, RESET);
  enqueueSnackbar('設定を削除しました', { variant: 'success' });
});

const Container: FC = () => {
  const conditions = useAtomValue(pluginConditionsAtom);
  const onClick = useSetAtom(handleConditionDeleteAtom);
  if (conditions.length < 2) {
    return null;
  }
  return <PluginConditionDeleteButton {...{ onClick }} />;
};

export default memo(Container);
