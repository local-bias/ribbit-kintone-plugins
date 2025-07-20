import { PluginConditionDeleteButton } from '@konomi-app/kintone-utilities-react';
import { produce } from 'immer';
import { useAtomValue } from 'jotai';
import { RESET, useAtomCallback } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import React, { FC, memo, useCallback } from 'react';
import {
  conditionsLengthAtom,
  pluginConfigAtom,
  selectedConditionIdAtom,
} from '../../states/plugin';

const Container: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const conditionsLength = useAtomValue(conditionsLengthAtom);

  const onClick = useAtomCallback(
    useCallback(async (get, set) => {
      const id = get(selectedConditionIdAtom);
      set(pluginConfigAtom, (_, _storage = _!) =>
        produce(_storage, (draft) => {
          const index = draft.conditions.findIndex((condition) => condition.id === id);
          draft.conditions.splice(index, 1);
        })
      );
      set(selectedConditionIdAtom, RESET);
      enqueueSnackbar('設定を削除しました', { variant: 'success' });
    }, [])
  );

  if (conditionsLength < 2) {
    return null;
  }

  return <PluginConditionDeleteButton {...{ onClick }} />;
};

export default memo(Container);
