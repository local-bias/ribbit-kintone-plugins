import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { TooltipIcon } from '@/lib/components/tooltip-icon';
import { getNewCondition } from '@/lib/plugin';
import { PluginCondition } from '@/schema/plugin-config';
import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { useAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import { useSnackbar } from 'notistack';
import { FC, useCallback } from 'react';

const Icon = ({ condition }: { condition: PluginCondition }) => {
  const { type, emoji, iconType, iconColor } = condition;

  if (type === 'emoji') {
    return <span className='text-xl'>{emoji}</span>;
  }
  return <TooltipIcon iconType={iconType} iconColor={iconColor} />;
};

const Sidebar: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);
  const label = useCallback((params: { condition: PluginCondition; index: number }) => {
    const { condition, index } = params;

    let label = condition.fieldCode || '未設定';

    return (
      <div className='pl-0 bg-transparent border-0 cursor-pointer outline-none text-left text-gray-600 text-sm grid grid-cols-[auto_1fr] items-center'>
        <Icon condition={condition} />
        <div className='pl-4'>
          <div className='text-[11px] text-gray-400'>{`設定${index + 1}`}</div>
          <div>{label}</div>
        </div>
      </div>
    );
  }, []);

  const onSelectedConditionChange = (condition: PluginCondition | null) => {
    setSelectedConditionId(condition?.id ?? RESET);
  };

  const onConditionDelete = () => {
    enqueueSnackbar('設定情報を削除しました', { variant: 'success' });
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
          enqueueSnackbar('設定情報をコピーしました', { variant: 'success' });
        },
        onPaste: () => {
          enqueueSnackbar('設定情報を貼り付けました', { variant: 'success' });
          return null;
        },
        onPasteFailure: () => {
          enqueueSnackbar('設定情報の形式が正しくありません', { variant: 'error' });
        },
        onPasteValidation: (condition) => {
          try {
            // validateCondition(condition);
          } catch (error) {
            return false;
          }
          return true;
        },
        onPasteValidationError: () => {
          enqueueSnackbar('設定情報の形式が正しくありません', { variant: 'error' });
        },
      }}
    />
  );
};

export default Sidebar;
