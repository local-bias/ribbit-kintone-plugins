import { isConditionIdUnselectedAtom, getConditionPropertyAtom } from '@/config/states/plugin';
import { JotaiRadio, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import DeleteButton from './condition-delete-button';
import PageModeFields from './page-mode-fields';
import DisplayScreensForm from './display-screens-form';

const FormContent: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>ページモード</PluginFormTitle>
        <PluginFormDescription last>
          他のアプリを開くか、特定のURLを開くかを選択します
        </PluginFormDescription>
        <JotaiRadio
          atom={getConditionPropertyAtom('pageMode')}
          options={[
            { label: '他アプリ', value: 'app' },
            { label: 'URL', value: 'url' },
          ]}
        />
      </PluginFormSection>
      <PageModeFields />

      <PluginFormSection>
        <PluginFormTitle>表示画面</PluginFormTitle>
        <PluginFormDescription last>
          どの画面にボタンを設置するかを選択します（複数選択可能）
        </PluginFormDescription>
        <DisplayScreensForm />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>ボタンラベル</PluginFormTitle>
        <PluginFormDescription last>ボタンに表示するラベルを設定します</PluginFormDescription>
        <JotaiText atom={getConditionPropertyAtom('buttonLabel')} placeholder='例: 詳細を見る' />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>表示モード</PluginFormTitle>
        <PluginFormDescription last>
          どのような形式でページを表示するかを選択します
        </PluginFormDescription>
        <JotaiRadio
          atom={getConditionPropertyAtom('displayMode')}
          options={[
            { label: 'モーダル', value: 'modal' },
            { label: 'ドロワー', value: 'drawer' },
            { label: '分割表示', value: 'split' },
          ]}
        />
      </PluginFormSection>

      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const isUnselected = useAtomValue(isConditionIdUnselectedAtom);

  if (isUnselected) {
    return (
      <div className='p-4'>
        <PluginFormDescription>左側のサイドバーから設定を選択してください</PluginFormDescription>
      </div>
    );
  }

  return <FormContent />;
};

export default FormContainer;
