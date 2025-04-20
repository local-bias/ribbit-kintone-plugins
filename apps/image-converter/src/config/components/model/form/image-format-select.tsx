import { getConditionPropertyAtom } from '@/config/states/plugin';
import { IMAGE_FORMAT_LIST, ImageFormat } from '@/schema/image';
import { MenuItem, Skeleton, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC, Suspense } from 'react';

const imageFormatAtom = getConditionPropertyAtom('imageFormat');

const handleSpaceIdChange = atom(null, (_, set, newValue: ImageFormat) => {
  set(imageFormatAtom, newValue);
});

const Component: FC = () => {
  const format = useAtomValue(imageFormatAtom);
  const onChange = useSetAtom(handleSpaceIdChange);

  return (
    <TextField
      select
      label='画像形式'
      value={format}
      onChange={(e) => onChange(e.target.value as ImageFormat)}
      sx={{ width: 150 }}
    >
      {IMAGE_FORMAT_LIST.map((format) => (
        <MenuItem key={format} value={format}>
          {format}
        </MenuItem>
      ))}
    </TextField>
  );
};

const PlaceHolder: FC = () => {
  return <Skeleton variant='rounded' width={350} height={56} />;
};

const ImageFormatSelectForm: FC = () => {
  return (
    <Suspense fallback={<PlaceHolder />}>
      <Component />
    </Suspense>
  );
};

export default ImageFormatSelectForm;
