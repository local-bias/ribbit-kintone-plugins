import { Alert, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { useAtom } from '@repo/jotai';
import { targetScreensAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import type { TargetScreen } from '@/schema/plugin-config';

const SCREEN_OPTIONS = [
  { value: 'create', labelKey: 'config.condition.screens.create' },
  { value: 'edit', labelKey: 'config.condition.screens.edit' },
  { value: 'detail', labelKey: 'config.condition.screens.detail' },
] as const satisfies { value: TargetScreen; labelKey: Parameters<typeof t>[0] }[];

/** タブを表示する画面を選択します */
export function ScreensSelect() {
  const [targetScreens, setTargetScreens] = useAtom(targetScreensAtom);

  const toggle = (value: TargetScreen) => {
    setTargetScreens((prev) =>
      prev.includes(value) ? prev.filter((screen) => screen !== value) : [...prev, value]
    );
  };

  return (
    <div className='grid gap-2'>
      <FormGroup row>
        {SCREEN_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={targetScreens.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
            }
            label={t(option.labelKey)}
          />
        ))}
      </FormGroup>
      {targetScreens.length === 0 && (
        <Alert severity='warning' sx={{ width: 'fit-content' }}>
          {t('config.condition.screens.empty')}
        </Alert>
      )}
    </div>
  );
}
