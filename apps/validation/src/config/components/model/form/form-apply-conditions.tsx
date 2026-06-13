import { FieldConditionInput, type FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Skeleton } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useAtomValue } from '@repo/jotai';
import { useAtomCallback } from '@repo/jotai/utils';
import { type FC, Suspense, useCallback } from 'react';
import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { LANGUAGE } from '@/lib/global';

const applyConditionsAtom = getConditionPropertyAtom('applyConditions');

const defaultCondition = (): FieldConditionValue => ({
  fieldCode: '',
  conditionType: 'always',
});

const FormApplyConditionsContent: FC = () => {
  const conditions = useAtomValue(applyConditionsAtom) as FieldConditionValue[];
  const fields = useAtomValue(currentAppFieldsAtom);

  const handleAdd = useAtomCallback(
    useCallback((_, set) => {
      set(applyConditionsAtom, (prev) => [...prev, defaultCondition()]);
    }, [])
  );

  const handleChange = useAtomCallback(
    useCallback((_, set, index: number, value: FieldConditionValue) => {
      set(applyConditionsAtom, (prev) => prev.map((c, i) => (i === index ? value : c)));
    }, [])
  );

  const handleDelete = useAtomCallback(
    useCallback((_, set, index: number) => {
      set(applyConditionsAtom, (prev) => prev.filter((_c, i) => i !== index));
    }, [])
  );

  return (
    <div className='flex flex-col gap-2'>
      {conditions.length === 0 && (
        <p className='text-sm text-gray-500'>
          条件が設定されていません。常にバリデーションを適用します。
        </p>
      )}
      {conditions.map((condition, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: 条件の並びはインデックスで安定している
        <div key={index} className='flex items-start gap-1'>
          <div className='flex-1 flex gap-1'>
            <FieldConditionInput
              fields={fields}
              value={condition}
              onChange={(v) => handleChange(index, v)}
              lang={LANGUAGE}
            />
          </div>
          <IconButton size='small' onClick={() => handleDelete(index)} aria-label='条件を削除'>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </div>
      ))}
      <div>
        <Button size='small' variant='outlined' startIcon={<AddIcon />} onClick={() => handleAdd()}>
          条件を追加
        </Button>
      </div>
    </div>
  );
};

const FormApplyConditions: FC = () => {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={200} height={40} />}>
      <FormApplyConditionsContent />
    </Suspense>
  );
};

export default FormApplyConditions;
