import { buttonLabelAtom, pluginConditionModeAtom } from '@/config/states/plugin';
import { JotaiRadio, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import DeleteButton from './condition-delete-button';
import { useAtomValue } from 'jotai';
import FormIcon from './icon';
import FieldsForm from './form-view-fields';
import DstAppIdForm from './form-dst-app-id';

function SourceModeForm() {
  const mode = useAtomValue(pluginConditionModeAtom);
  if (mode !== 'source') {
    return null;
  }
  return (
    <>
      <PluginFormSection>
        <PluginFormTitle>コピー先アプリ</PluginFormTitle>
        <PluginFormDescription last>
          レコードをコピーする先のアプリを選択します
        </PluginFormDescription>
        <DstAppIdForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>アクションボタンのラベル</PluginFormTitle>
        <PluginFormDescription last>
          設置するアクションボタンに表示するラベルを設定します
        </PluginFormDescription>
        <JotaiText atom={buttonLabelAtom} />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>フィールドの設定</PluginFormTitle>
        <PluginFormDescription last>
          コピー先のアプリの各フィールドに、どういった情報をコピーするかを設定します
        </PluginFormDescription>
        <FieldsForm />
      </PluginFormSection>
    </>
  );
}

function DestinationModeForm() {
  const mode = useAtomValue(pluginConditionModeAtom);
  if (mode !== 'destination') {
    return null;
  }
  return (
    <div className='grid place-items-center gap-8'>
      <FormIcon className='w-72 h-72' />
      <div>
        <p>
          このプラグインは、コピー元、コピー先それぞれに適用する必要があります。
          <br />
          モードを「コピー元」に設定したアプリ側で、その他の設定を行ってください。
        </p>
      </div>
    </div>
  );
}

export default function FormContent() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>モード</PluginFormTitle>
        <PluginFormDescription>
          このアプリをコピー元とするのか、コピー先とするのかを選択します
        </PluginFormDescription>
        <PluginFormDescription last>
          アクションボタンをクリックした際の動作は「コピー元」で指定し、「コピー先」では設定不要です
        </PluginFormDescription>
        <JotaiRadio
          width={600}
          atom={pluginConditionModeAtom}
          options={[
            { label: 'コピー元 (アクションボタンを設置するアプリ)', value: 'source' },
            { label: 'コピー先 (情報をコピーしてレコードを作成するアプリ)', value: 'destination' },
          ]}
        />
      </PluginFormSection>
      <SourceModeForm />
      <DestinationModeForm />
      <DeleteButton />
    </div>
  );
}
