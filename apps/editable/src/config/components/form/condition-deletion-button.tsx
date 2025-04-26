import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';
import { produce } from 'immer';
import { FC } from 'react';

import { useSetAtom } from 'jotai';
import { pluginConfigAtom } from '../../states/plugin';

type ContainerProps = Readonly<{ index: number }>;
type Props = Readonly<{ onClick: () => void }>;

const Component: FC<Props> = ({ onClick }) => (
  <IconButton {...{ onClick }}>
    <DeleteIcon fontSize='small' />
  </IconButton>
);

const Container: FC<ContainerProps> = ({ index }) => {
  const setStorage = useSetAtom(pluginConfigAtom);

  const onClick = () => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions.splice(index, 1);
      })
    );
  };

  return <Component {...{ onClick }} />;
};

export default Container;
