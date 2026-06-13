import { JotaiSwitch } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from '@repo/jotai';
import type { FC } from 'react';
import { getConditionPropertyAtom, isConditionIdUnselectedAtom } from '@/config/states/plugin';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import FormApplyConditions from './form-apply-conditions';
import FieldCodeForm from './form-fieldcode';
import ValidationRulesForm from './form-rules';
import TargetEventsForm from './form-target-events';

const FormContent: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>対象フィールド</PluginFormTitle>
        <PluginFormDescription last>
          入力チェックを行うフィールドを選択してください。
        </PluginFormDescription>
        <FieldCodeForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>適用する画面</PluginFormTitle>
        <PluginFormDescription last>
          入力チェックを適用する画面を選択してください。
        </PluginFormDescription>
        <TargetEventsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>適用条件</PluginFormTitle>
        <PluginFormDescription last>
          バリデーションを適用する条件を設定してください。
          指定したすべての条件を満たすレコードのみ入力チェックを行います。
          条件を設定しない場合は常に適用されます。
        </PluginFormDescription>
        <FormApplyConditions />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>フィールド変更時にエラーを表示</PluginFormTitle>
        <PluginFormDescription last>
          有効にすると、フィールドの値が変更された直後にエラーメッセージを表示します。
          無効の場合は、レコード保存時のみエラーが表示されます。
        </PluginFormDescription>
        <JotaiSwitch
          atom={getConditionPropertyAtom('showErrorOnChange')}
          label='フィールド変更時にエラーを表示する'
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>バリデーションルール</PluginFormTitle>
        <PluginFormDescription last>
          入力チェックのルールを設定してください。複数のルールを設定できます。
        </PluginFormDescription>
        <ValidationRulesForm />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
