import { appFieldsAtom } from '@/config/states/kintone';
import { pluginConditionsAtom, selectedConditionIdAtom } from '@/config/states/plugin';
import { getNewCondition, isPluginConditionMet, PluginCondition } from '@/lib/plugin';
import { BundledSidebar } from '@konomi-app/kintone-utilities-react';
import { useAtom, useAtomValue } from 'jotai';
import { useSnackbar } from 'notistack';
import { FC, Suspense } from 'react';
import styled from '@emotion/styled';

const LabelRoot = styled.div``;

const LabelIndex = styled.div`
  font-size: 11px;
  line-height: 16px;
  color: #9ca3af;
`;

const LabelText = styled.div`
  font-size: 14px;
  line-height: 20px;
  color: #4b5563;
`;

const AwaitedLabel: FC<{ condition: PluginCondition }> = ({ condition }) => {
  const views = useAtomValue(appFieldsAtom);
  const found = views.find((view) => view.code === condition.fieldCode);
  return <>{`${(found?.label ?? condition.fieldCode) || '未設定'}`}</>;
};

const Label: FC<{ condition: PluginCondition; index: number }> = ({ condition, index }) => {
  return (
    <LabelRoot>
      <LabelIndex>設定{index + 1}</LabelIndex>
      <LabelText>
        <Suspense fallback={<>{condition.fieldCode}</>}>
          <AwaitedLabel condition={condition} />
        </Suspense>
      </LabelText>
    </LabelRoot>
  );
};

const Sidebar: FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [conditions, setConditions] = useAtom(pluginConditionsAtom);
  const [selectedConditionId, setSelectedConditionId] = useAtom(selectedConditionIdAtom);
  const label = (params: { condition: PluginCondition; index: number }) => <Label {...params} />;

  const onSelectedConditionChange = (condition: PluginCondition | null) => {
    setSelectedConditionId(condition?.id ?? null);
  };

  const onConditionDelete = () => {
    enqueueSnackbar('設定情報を削除しました', { variant: 'success' });
  };

  return (
    <BundledSidebar
      conditions={conditions}
      // @ts-ignore
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
        onPasteValidation: (condition) => {
          try {
            isPluginConditionMet(condition);
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
