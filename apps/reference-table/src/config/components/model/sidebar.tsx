import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { Skeleton } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useSnackbar } from 'notistack';
import { type FC, Suspense, useCallback } from 'react';
import { kintoneAppsAtom } from '@/config/states/kintone';
import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewCondition, isPluginConditionMet } from '@/lib/plugin';
import type { PluginCondition } from '@/schema/plugin-config';

const AwaitedLabel: FC<{ condition: PluginCondition }> = ({ condition }) => {
  const apps = useAtomValue(kintoneAppsAtom);
  const app = apps.find((a) => String(a.appId) === String(condition.relatedAppId));
  const appName = app?.name ?? null;
  const subtableCode = condition.relatedSubtableCode;

  if (!appName && !subtableCode) {
    return <>{t('common.config.sidebar.tab.defaultLabel')}</>;
  }

  return (
    <>
      {appName || t('common.config.sidebar.tab.defaultLabel')}
      {subtableCode && <span className='text-xs text-gray-400'> / {subtableCode}</span>}
    </>
  );
};

const Label: FC<{ condition: PluginCondition; index: number }> = ({ condition, index }) => {
  return (
    <div>
      <div className='text-[11px] leading-4 text-gray-400'>
        {t('common.config.sidebar.tab.label')}
        {index + 1}
      </div>
      <div className='text-sm text-gray-600'>
        <Suspense fallback={<Skeleton variant='text' width={120} />}>
          <AwaitedLabel condition={condition} />
        </Suspense>
      </div>
    </div>
  );
};

function Sidebar() {
  const { enqueueSnackbar } = useSnackbar();
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);
  const label = useCallback(
    (params: { condition: PluginCondition; index: number }) => <Label {...params} />,
    []
  );

  const onSelectedConditionChange = (condition: PluginCondition | null) => {
    setSelectedConditionId(condition?.id ?? null);
  };

  const onConditionDelete = () => {
    enqueueSnackbar(t('common.config.toast.onConditionDelete'), { variant: 'success' });
  };

  return (
    <BundledSidebar
      conditions={conditions}
      setConditions={setConditions}
      getNewCondition={getNewCondition}
      labelComponent={label}
      onSelectedConditionChange={onSelectedConditionChange}
      selectedConditionId={selectedConditionId}
      onConditionDelete={onConditionDelete}
      context={{
        onCopy: () => {
          enqueueSnackbar(t('common.config.sidebar.context.onCopy'), { variant: 'success' });
        },
        onPaste: () => {
          enqueueSnackbar(t('common.config.sidebar.context.onPaste'), { variant: 'success' });
          return null;
        },
        onPasteValidation: (condition) => isPluginConditionMet(condition),
        onPasteValidationError: () => {
          enqueueSnackbar(t('common.config.sidebar.context.onPasteFailure'), { variant: 'error' });
        },
      }}
    />
  );
}

export default Sidebar;
