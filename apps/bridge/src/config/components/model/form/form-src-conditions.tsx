import { FieldConditionInput, type FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Skeleton } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useAtom, useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { currentAppFieldsAtom } from '@/config/states/kintone';
import { srcConditionsAtom } from '@/config/states/plugin';
import { LANGUAGE } from '@/lib/global';
import { t } from '@/lib/i18n';

const defaultCondition = (): FieldConditionValue => ({
  fieldCode: '',
  conditionType: 'always',
});

function FormSrcConditionsComponent() {
  const [srcConditions, setSrcConditions] = useAtom(srcConditionsAtom);
  const fields = useAtomValue(currentAppFieldsAtom);

  const handleAdd = () => {
    setSrcConditions([...srcConditions, defaultCondition()]);
  };

  const handleChange = (index: number, value: FieldConditionValue) => {
    const updated = [...srcConditions];
    updated[index] = value;
    setSrcConditions(updated);
  };

  const handleDelete = (index: number) => {
    setSrcConditions(srcConditions.filter((_, i) => i !== index));
  };

  return (
    <div className='flex flex-col gap-2'>
      {srcConditions.length === 0 && (
        <p className='text-sm text-gray-500'>{t('config.condition.queryBuilder.noConditions')}</p>
      )}
      {srcConditions.map((condition, index) => (
        <div key={index} className='flex items-start gap-1'>
          <div className='flex-1 flex gap-1'>
            <FieldConditionInput
              fields={fields}
              value={condition as FieldConditionValue}
              onChange={(v) => handleChange(index, v)}
              lang={LANGUAGE}
            />
          </div>
          <IconButton
            size='small'
            onClick={() => handleDelete(index)}
            aria-label={t('config.condition.srcConditions.delete')}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </div>
      ))}
      <div>
        <Button size='small' variant='outlined' startIcon={<AddIcon />} onClick={handleAdd}>
          {t('config.condition.srcConditions.add')}
        </Button>
      </div>
    </div>
  );
}

function FormSrcConditions() {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={200} height={40} />}>
      <FormSrcConditionsComponent />
    </Suspense>
  );
}

export default FormSrcConditions;
