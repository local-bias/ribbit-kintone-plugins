import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { openaiApiKeyAtom } from '@/config/states/plugin';

function CommonSettingsForm() {
  return (
    <div style={{ padding: '16px' }}>
      <PluginFormSection>
        <PluginFormTitle>OpenAI APIキー</PluginFormTitle>
        <PluginFormDescription last>OpenAI APIの認証キーを入力してください。</PluginFormDescription>
        <JotaiText
          atom={openaiApiKeyAtom}
          type='password'
          variant='outlined'
          label='APIキー'
          placeholder='sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
          width={510}
        />
      </PluginFormSection>
    </div>
  );
}

export default CommonSettingsForm;
