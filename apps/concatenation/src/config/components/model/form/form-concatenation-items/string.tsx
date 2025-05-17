import { concatenationItemsState } from '@/config/states/plugin';
import { FormControlLabel, Switch, TextField } from '@mui/material';
import { produce } from 'immer';
import { useAtomCallback } from 'jotai/utils';
import { FC, useCallback } from 'react';

type ContainerProps = { item: Plugin.Condition['concatenationItems'][number]; index: number };
type Props = { item: Plugin.ConcatenationItem.String; index: number };

const Component: FC<Props> = ({ item, index }) => {
  const onStringChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: string) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            //@ts-ignore
            draft[index].value = value;
          })
        ),
      []
    )
  );

  const onOmittedIfPreviousEmptyChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: boolean) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            //@ts-ignore
            draft[index].isOmittedIfPreviousEmpty = value;
          })
        ),
      []
    )
  );

  const onOmittedIfNextEmptyChange = useAtomCallback(
    useCallback(
      (_, set, index: number, value: boolean) =>
        set(concatenationItemsState, (prev) =>
          produce(prev, (draft) => {
            //@ts-ignore
            draft[index].isOmittedIfNextEmpty = value;
          })
        ),
      []
    )
  );

  return (
    <>
      <div className='col-span-7'>
        <TextField
          variant='outlined'
          color='primary'
          label='文字列'
          fullWidth
          value={item.value}
          onChange={(e) => onStringChange(index, e.target.value)}
        />
      </div>
      {index !== 0 && (
        <div className='col-span-10'>
          <FormControlLabel
            control={
              <Switch
                checked={item.isOmittedIfPreviousEmpty}
                onChange={(_, checked) => onOmittedIfPreviousEmptyChange(index, checked)}
              />
            }
            label='直前のフィールドの値が空の場合は出力しない'
          />
        </div>
      )}
      <div className='col-span-10'>
        <FormControlLabel
          control={
            <Switch
              checked={item.isOmittedIfNextEmpty}
              onChange={(_, checked) => onOmittedIfNextEmptyChange(index, checked)}
            />
          }
          label='直後のフィールドの値が空の場合は出力しない'
        />
      </div>
    </>
  );
};

const Container: FC<ContainerProps> = (props) => {
  if (props.item.type !== 'string') {
    return null;
  }
  return <Component {...(props as Props)} />;
};

export default Container;
