import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import { getNewCondition, isPluginConditionMet } from '@/lib/plugin';
import { PluginCondition } from '@/schema/plugin-config';
import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { useAtom, useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { FC, Suspense, useCallback } from 'react';
import { Skeleton } from '@mui/material';
import { customViewsAtom } from '@/config/states/kintone';

const AwaitedLabel: FC<{ condition: PluginCondition }> = ({ condition }) => {
  const views = useAtomValue(customViewsAtom);
  const found = Object.values(views).find((view) => view.id === condition.viewId);
  return <>{`${found?.name ?? t('common.config.sidebar.tab.defaultLabel')}`}</>;
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

const Sidebar: FC = () => {
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
    toast.success(t('common.config.toast.onConditionDelete'));
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
          toast.success(t('common.config.sidebar.context.onCopy'));
        },
        onPaste: () => {
          toast.success(t('common.config.sidebar.context.onPaste'));
          return null;
        },
        onPasteValidation: (condition) => isPluginConditionMet(condition),
        onPasteValidationError: () => {
          toast.error(t('common.config.sidebar.context.onPasteFailure'));
        },
      }}
    />
  );
};

export default Sidebar;
