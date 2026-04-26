import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import { getConditionPropertyAtom, isConditionIdUnselectedAtom } from '@/config/states/plugin';
import type { ExecutionTiming } from '@/schema/plugin-config';
import AiModelForm from './ai-model';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import ExecutionTimingForm from './execution-timing';
import OutputFieldsForm from './output-fields';
import SystemPromptEditor from './system-prompt';

const maxExternalRecordsAtom = getConditionPropertyAtom('maxExternalRecords');
const apiTimeoutAtom = getConditionPropertyAtom('apiTimeout');
const executionTimingAtom = getConditionPropertyAtom('executionTiming');

const BUTTON_LABEL_TIMINGS: ExecutionTiming[] = ['manual', 'space_field'];

function ButtonLabelSection() {
  const timing = useAtomValue(executionTimingAtom);

  if (!BUTTON_LABEL_TIMINGS.includes(timing)) {
    return null;
  }

  return (
    <PluginFormSection>
      <h3>実行ボタンラベル</h3>
      <PluginFormDescription last>
        レコード詳細画面に表示するボタンのテキストを設定します。
      </PluginFormDescription>
      <JotaiText atom={getConditionPropertyAtom('buttonLabel')} label='ボタンラベル' />
    </PluginFormSection>
  );
}

function FormContent() {
  return (
    <div style={{ padding: '16px' }}>
      <PluginFormSection>
        <PluginFormTitle>設定メモ</PluginFormTitle>
        <PluginFormDescription last>
          この設定の用途を識別するためのメモを入力してください。
        </PluginFormDescription>
        <JotaiText atom={getConditionPropertyAtom('memo')} label='メモ' />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>AIモデル</PluginFormTitle>
        <PluginFormDescription last>使用するOpenAIモデルを選択してください。</PluginFormDescription>
        <AiModelForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>システムプロンプト</PluginFormTitle>
        <PluginFormDescription last>
          AIに送信するシステムプロンプトを入力してください。埋め込み構文を使用してレコード情報や外部アプリ情報を動的に挿入できます。
        </PluginFormDescription>
        <SystemPromptEditor />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>出力フィールド定義</PluginFormTitle>
        <PluginFormDescription last>
          AIが入力するフィールドを定義してください。AIは各フィールドの説明に基づいて入力先を判断します。
        </PluginFormDescription>
        <OutputFieldsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>実行タイミング</PluginFormTitle>
        <PluginFormDescription last>
          AI自動入力を実行するタイミングを設定します。
        </PluginFormDescription>
        <ExecutionTimingForm />
        <ButtonLabelSection />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>詳細設定</PluginFormTitle>
        <PluginFormDescription last>
          外部アプリ参照時の最大取得件数とAPIタイムアウト（秒）を設定します。
        </PluginFormDescription>
        <div style={{ display: 'flex', gap: '16px' }}>
          <JotaiText
            atom={maxExternalRecordsAtom}
            type='number'
            label='最大取得件数'
            sx={{ width: '200px' }}
          />
          <JotaiText
            atom={apiTimeoutAtom}
            type='number'
            label='タイムアウト(秒)'
            sx={{ width: '200px' }}
          />
        </div>
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
