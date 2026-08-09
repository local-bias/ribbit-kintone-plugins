import { appSpacesAtom } from '@/config/states/kintone';
import { getConditionSpaceIdAtom } from '@/config/states/plugin';
import { Autocomplete, Skeleton, TextField } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { FC, Suspense, useMemo } from 'react';

type Props = {
  index: number;
};

const Component: FC<Props> = ({ index }) => {
  const spaces = useAtomValue(appSpacesAtom);
  const spaceIdAtom = useMemo(() => getConditionSpaceIdAtom(index), [index]);
  const [spaceId, setSpaceId] = useAtom(spaceIdAtom);

  const onChange = (value: string) => {
    setSpaceId(value);
  };

  return (
    <Autocomplete
      value={spaces.find((field) => field.elementId === spaceId) ?? null}
      sx={{ width: '350px' }}
      options={spaces}
      isOptionEqualToValue={(option, v) => option.elementId === v.elementId}
      getOptionLabel={(option) => `${option.elementId}`}
      onChange={(_, field) => onChange(field?.elementId ?? '')}
      renderInput={(params) => (
        <TextField {...params} label='対象スペース' variant='outlined' color='primary' />
      )}
    />
  );
};

const PlaceHolder: FC = () => {
  return <Skeleton variant='rounded' width={350} height={56} />;
};

const Container: FC<Props> = (props) => {
  return (
    <Suspense fallback={<PlaceHolder />}>
      <Component {...props} />
    </Suspense>
  );
};

export default Container;
