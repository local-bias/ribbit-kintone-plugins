import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Alert } from '@mui/material';
import { getCommonPropertyAtom } from '@/config/states/plugin';
import { OAUTH_CALLBACK_URL } from '@/lib/constants';

function CommonSettingsForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>Google連携</PluginFormTitle>
        <PluginFormDescription>
          Google Cloud ConsoleでOAuth 2.0クライアントID(種類: ウェブアプリケーション)を作成し、
          Drive APIを有効化した上で、発行されたクライアントIDを入力してください。
        </PluginFormDescription>
        <PluginFormDescription last>
          OAuthクライアントの「承認済みのリダイレクトURI」には、次のURLを登録してください。
        </PluginFormDescription>
        <Alert severity='info' sx={{ mb: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {OAUTH_CALLBACK_URL}
        </Alert>
        <Alert severity='warning' sx={{ mb: 2 }}>
          Googleの仕様上、「ウェブアプリケーション」タイプのOAuthクライアントはPKCEを使用していても
          クライアントシークレットが必須です。本プラグインはバックエンドを持たないため、
          クライアントシークレットもこの設定画面に入力していただく必要があります。この値はkintoneの
          プラグイン設定として保存され、該当kintone環境の管理者が閲覧可能です(完全な機密情報としては
          扱われません)。
        </Alert>
        <div className='flex flex-col gap-4'>
          <JotaiText
            atom={getCommonPropertyAtom('oauthClientId')}
            label='OAuthクライアントID'
            placeholder='xxxxxxxx.apps.googleusercontent.com'
          />
          <JotaiText
            atom={getCommonPropertyAtom('oauthClientSecret')}
            label='OAuthクライアントシークレット'
            placeholder='GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
            type='password'
          />
        </div>
      </PluginFormSection>
    </div>
  );
}

export default CommonSettingsForm;
