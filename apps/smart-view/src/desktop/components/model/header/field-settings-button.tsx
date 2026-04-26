import SettingsIcon from '@mui/icons-material/Settings';
import { Button } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { pluginConditionAtom } from '@/desktop/states/plugin';
import { isFieldSettingsDialogOpenAtom } from '@/desktop/states/visible-fields';

export default function FieldSettingsButton() {
  const condition = useAtomValue(pluginConditionAtom);
  const setDialogOpen = useSetAtom(isFieldSettingsDialogOpenAtom);

  if (!condition?.isViewFieldsControlEnabled) {
    return null;
  }

  return (
    <Button
      variant='outlined'
      color='primary'
      size='small'
      startIcon={<SettingsIcon />}
      onClick={() => setDialogOpen(true)}
    >
      表示フィールド設定
    </Button>
  );
}
