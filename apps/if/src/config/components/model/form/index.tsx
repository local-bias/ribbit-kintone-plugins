import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from '@repo/jotai';
import { getConditionPropertyAtom, isConditionIdUnselectedAtom } from '@/config/states/plugin';

import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import FieldActionForm from './field-action-form';
import RowActionForm from './row-action-form';
import {
  ConditionLogicForm,
  ConditionsForm,
  TargetEventForm,
  TriggerTimingForm,
} from './trigger-form';

function FormContent() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>設定名</PluginFormTitle>
        <PluginFormDescription last>この設定の名前を入力してください。</PluginFormDescription>
        <JotaiText atom={getConditionPropertyAtom('memo')} />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>対象の画面</PluginFormTitle>
        <PluginFormDescription last>処理を適用する画面を選択してください。</PluginFormDescription>
        <TargetEventForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>実行タイミング</PluginFormTitle>
        <PluginFormDescription last>
          処理を発火させるタイミングを選択してください。
        </PluginFormDescription>
        <TriggerTimingForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>発火条件</PluginFormTitle>
        <PluginFormDescription last>
          指定した条件を満たす場合にアクションを実行します。条件を指定しない場合は常に実行されます。
        </PluginFormDescription>
        <div className='flex flex-col gap-3'>
          <ConditionLogicForm />
          <ConditionsForm />
        </div>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>フィールドへの自動入力</PluginFormTitle>
        <PluginFormDescription last>
          条件成立時に、指定したフィールドへ値を自動入力します。
        </PluginFormDescription>
        <FieldActionForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>テーブルの行操作</PluginFormTitle>
        <PluginFormDescription last>
          条件成立時に、テーブルへの行追加・行削除を行います。
        </PluginFormDescription>
        <RowActionForm />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
}

function PluginForm() {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
}

export default PluginForm;
