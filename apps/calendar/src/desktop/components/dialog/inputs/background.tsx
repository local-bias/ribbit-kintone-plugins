import { dialogEventAtom } from '@/desktop/states/dialog';
import { isBackgroundEventAvailableAtom } from '@/desktop/states/kintone';
import { t } from '@/lib/i18n-plugin';
import { FormControlLabel, Switch } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';

/** 予定を背景イベントとして表示するかどうかの切り替え(背景イベントが有効な場合のみ表示) */
export default function DialogBackgroundEventForm() {
  const isAvailable = useAtomValue(isBackgroundEventAvailableAtom);
  const [event, setEvent] = useAtom(dialogEventAtom);

  if (!isAvailable) {
    return null;
  }

  const onChange = (_: unknown, checked: boolean) => {
    setEvent((current) => ({ ...current, display: checked ? 'background' : undefined }));
  };

  return (
    <div>
      <FormControlLabel
        control={
          <Switch size='small' checked={event.display === 'background'} onChange={onChange} />
        }
        label={t('desktop.dialog.backgroundEvent')}
      />
    </div>
  );
}
