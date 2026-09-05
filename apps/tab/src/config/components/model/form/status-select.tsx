import { Alert } from '@mui/material';
import { useAtomValue } from '@repo/jotai';
import { currentAppStatusNamesAtom } from '@/config/states/kintone';
import { statusesAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { StringMultiSelect } from './string-multi-select';

/** プロセス管理のステータスによる表示条件を編集します */
export function StatusSelect() {
  const statusNames = useAtomValue(currentAppStatusNamesAtom);

  if (statusNames.length === 0) {
    return (
      <Alert severity='info' sx={{ width: 'fit-content' }}>
        {t('config.condition.statuses.disabled')}
      </Alert>
    );
  }

  return (
    <StringMultiSelect
      valuesAtom={statusesAtom}
      optionsAtom={currentAppStatusNamesAtom}
      label={t('config.condition.statuses.label')}
      placeholder={t('config.condition.statuses.label')}
      noOptionsText={t('config.condition.statuses.disabled')}
    />
  );
}
