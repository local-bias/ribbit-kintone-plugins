import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { isProd } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { getNewCondition, validateCondition } from '@/lib/plugin';
import { PluginCondition } from '@/schema/plugin-config';
import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { useAtom, useAtomValue } from 'jotai';
import { RESET } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import { FC, useCallback } from 'react';
import { allAppViewsAtom } from '../states/kintone';

const SidebarLabel: FC<{ viewId: string; }> = ({ viewId }) => {
  const allViews = useAtomValue(allAppViewsAtom);
  const view = Object.values(allViews).find((view) => view.id === viewId);
  return <>{view?.name ?? t('config.sidebar.notSet')}</>;
};

const Sidebar: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);
  const label = useCallback((params: { condition: PluginCondition; index: number; }) => {
    const { condition, index } = params;

    return (
      <div>
        <div className='text-[11px] text-gray-400'>{t('config.sidebar.settingLabel', String(index + 1))}</div>
        <div>
          <SidebarLabel viewId={condition.viewId} />
        </div>
      </div>
    );
  }, []);

  const onSelectedConditionChange = (condition: PluginCondition | null) => {
    setSelectedConditionId(condition?.id ?? RESET);
  };

  const onConditionDelete = () => {
    enqueueSnackbar(t('config.toast.settingDeleted'), { variant: 'success' });
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
          console.log('copied');
          enqueueSnackbar(t('config.toast.settingCopied'), { variant: 'success' });
        },
        onPaste: () => {
          enqueueSnackbar(t('config.toast.settingPasted'), { variant: 'success' });
          return null;
        },
        onPasteFailure: () => {
          enqueueSnackbar(t('config.toast.settingInvalidFormat'), { variant: 'error' });
        },
        onPasteValidation: (condition) => {
          try {
            validateCondition(condition);
          } catch (error) {
            !isProd && console.error(error);
            return false;
          }
          return true;
        },
        onPasteValidationError: () => {
          enqueueSnackbar(t('config.toast.settingInvalidFormat'), { variant: 'error' });
        },
      }}
    />
  );
};

export default Sidebar;
