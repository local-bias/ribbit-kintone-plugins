import { JotaiSwitch } from '@/components/jotai/switch';
import {
  confirmsRescheduleState,
  enablesDragAndDropState,
  preventsOverlapState,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { useAtomValue } from 'jotai';

/** カレンダー上でのドラッグ&ドロップ操作の設定 */
export default function FormInteraction() {
  const enablesDragAndDrop = useAtomValue(enablesDragAndDropState);

  return (
    <div className='grid'>
      <JotaiSwitch atom={enablesDragAndDropState} label={t('config.form.enablesDragAndDrop')} />
      <JotaiSwitch
        atom={confirmsRescheduleState}
        label={t('config.form.confirmsReschedule')}
        disabled={!enablesDragAndDrop}
      />
      <JotaiSwitch atom={preventsOverlapState} label={t('config.form.preventsOverlap')} />
    </div>
  );
}
