import { createIfNotExistsAtom, deleteRelatedRecordsAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import { useAtomValue } from 'jotai';

export default function FormCreateIfNotExists() {
  const deleteRelatedRecords = useAtomValue(deleteRelatedRecordsAtom);

  return (
    <div className='mt-4'>
      <JotaiSwitch
        label={t('config.condition.createIfNotExists.label')}
        atom={createIfNotExistsAtom}
        disabled={deleteRelatedRecords}
      />
    </div>
  );
}
