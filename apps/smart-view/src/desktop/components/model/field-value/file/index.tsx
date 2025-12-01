import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DeepReadonly } from 'utility-types';
import Images from './images';
import Links from './links';

type Props = DeepReadonly<{ field: kintoneAPI.field.File }>;

export default function FileFieldValue({ field }: Props) {
  const files = field.value;

  const images: kintoneAPI.field.File['value'] = [];
  const others: kintoneAPI.field.File['value'] = [];

  for (const file of files) {
    if (/^image\//.test(file.contentType)) {
      images.push(file);
    } else {
      others.push(file);
    }
  }

  return (
    <>
      <Images files={images} />
      <Links files={others} />
    </>
  );
}
