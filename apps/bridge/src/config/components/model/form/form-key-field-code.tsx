import { t } from '@/lib/i18n';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { useAtomValue, useSetAtom } from 'jotai';
import { Link2Icon } from 'lucide-react';
import { FC } from 'react';
import { bindableAppFieldsAtom, dstAppFieldsState } from '../../../states/kintone';
import { dstKeyFieldCodeAtom, srcKeyFieldCodeAtom } from '../../../states/plugin';

const SrcKeyFieldCodeSelect: FC = () => {
  const srcKeyFieldCode = useAtomValue(srcKeyFieldCodeAtom);
  const setSrcKeyFieldCode = useSetAtom(srcKeyFieldCodeAtom);

  return (
    <JotaiFieldSelect
      label={t('config.condition.keyFieldCode.src.label')}
      fieldPropertiesAtom={bindableAppFieldsAtom}
      onChange={setSrcKeyFieldCode}
      fieldCode={srcKeyFieldCode}
    />
  );
};

const DstKeyFieldCodeSelect: FC = () => {
  const dstKeyFieldCode = useAtomValue(dstKeyFieldCodeAtom);
  const setDstKeyFieldCode = useSetAtom(dstKeyFieldCodeAtom);

  return (
    <JotaiFieldSelect
      label={t('config.condition.keyFieldCode.dst.label')}
      fieldPropertiesAtom={dstAppFieldsState}
      onChange={setDstKeyFieldCode}
      fieldCode={dstKeyFieldCode}
    />
  );
};

const Container: FC = () => {
  return (
    <div className='flex items-center gap-4'>
      <SrcKeyFieldCodeSelect />
      <Link2Icon />
      <DstKeyFieldCodeSelect />
    </div>
  );
};

export default Container;
