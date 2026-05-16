import { JotaiNumber, JotaiSwitch, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Autocomplete, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { getCommonPropertyAtom } from '@/config/states/plugin';
import { DEFAULT_BASE_URLS, DEFAULT_MODELS, PROVIDER_LABELS } from '@/lib/static';
import { AI_PROVIDER_TYPES } from '@/schema/plugin-config';

const providerTypeAtom = getCommonPropertyAtom('providerType');
const modelAtom = getCommonPropertyAtom('model');
const baseUrlAtom = getCommonPropertyAtom('baseUrl');

function ProviderSelect() {
  const [providerType, setProviderType] = useAtom(providerTypeAtom);
  return (
    <FormControl size='small' sx={{ minWidth: 280 }}>
      <InputLabel id='ai-butler-provider-type-label'>AIプロバイダー</InputLabel>
      <Select
        labelId='ai-butler-provider-type-label'
        label='AIプロバイダー'
        value={providerType}
        onChange={(event) => {
          const next = event.target.value as (typeof AI_PROVIDER_TYPES)[number];
          setProviderType(next);
        }}
      >
        {AI_PROVIDER_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {PROVIDER_LABELS[type]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function ModelInput() {
  const providerType = useAtomValue(providerTypeAtom);
  const [model, setModel] = useAtom(modelAtom);
  const candidates = DEFAULT_MODELS[providerType] ?? [];
  return (
    <Autocomplete
      freeSolo
      size='small'
      sx={{ minWidth: 360 }}
      value={model ?? ''}
      options={candidates}
      onChange={(_, value) => setModel(typeof value === 'string' ? value : (value ?? ''))}
      onInputChange={(_, value) => setModel(value)}
      renderInput={(params) => <TextField {...params} label='モデル名' variant='outlined' />}
    />
  );
}

function BaseUrlInput() {
  const providerType = useAtomValue(providerTypeAtom);
  const placeholder = DEFAULT_BASE_URLS[providerType] || '例: https://example.com/v1';
  return (
    <JotaiText
      atom={baseUrlAtom}
      label='Base URL (任意)'
      placeholder={placeholder}
      sx={{ minWidth: 480 }}
    />
  );
}

function CommonSettingsForm() {
  return (
    <div className='p-4 flex flex-col gap-2'>
      <PluginFormSection>
        <PluginFormTitle>AIプロバイダー</PluginFormTitle>
        <PluginFormDescription>
          利用するAIプロバイダーを選択します。OpenAI互換のAPIエンドポイントを持つサービスに対応しています。
        </PluginFormDescription>
        <PluginFormDescription last>
          Azure / カスタムを利用する場合は、下記Base URLにエンドポイントを入力してください。
        </PluginFormDescription>
        <ProviderSelect />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>APIキー</PluginFormTitle>
        <PluginFormDescription last>
          AIプロバイダーへの認証に使用するAPIキーを入力します。
        </PluginFormDescription>
        <JotaiText
          atom={getCommonPropertyAtom('apiKey')}
          type='password'
          label='APIキー'
          placeholder='sk-...'
          sx={{ minWidth: 480 }}
        />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>Base URL</PluginFormTitle>
        <PluginFormDescription last>
          OpenAI互換APIのエンドポイントURL。空欄の場合は選択中のプロバイダーの既定値を使用します。
        </PluginFormDescription>
        <BaseUrlInput />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>モデル</PluginFormTitle>
        <PluginFormDescription last>
          既定で使用するAIモデル名を入力します。候補から選択するか、自由に入力できます。
        </PluginFormDescription>
        <ModelInput />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>共通システムプロンプト</PluginFormTitle>
        <PluginFormDescription last>
          全てのプロンプトテンプレートで利用される共通の system プロンプトです。
        </PluginFormDescription>
        <JotaiText
          atom={getCommonPropertyAtom('systemPrompt')}
          label='共通システムプロンプト'
          multiline
          minRows={3}
          maxRows={10}
          sx={{ minWidth: 600 }}
        />
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>生成パラメータ</PluginFormTitle>
        <PluginFormDescription last>
          AI 出力の温度 (creativity) と最大トークン数を指定します。
        </PluginFormDescription>
        <div className='flex items-center gap-4'>
          <JotaiNumber
            atom={getCommonPropertyAtom('temperature')}
            label='temperature'
            slotProps={{ htmlInput: { step: 0.1, min: 0, max: 2 } }}
          />
          <JotaiNumber
            atom={getCommonPropertyAtom('maxTokens')}
            label='max_tokens'
            slotProps={{ htmlInput: { step: 64, min: 1 } }}
          />
        </div>
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>機能の有効/無効</PluginFormTitle>
        <PluginFormDescription last>各機能の有効/無効を切り替えます。</PluginFormDescription>
        <div className='flex flex-col gap-1'>
          <JotaiSwitch atom={getCommonPropertyAtom('chatEnabled')} label='AIチャットを有効化' />
          <JotaiSwitch
            atom={getCommonPropertyAtom('fileAttachmentEnabled')}
            label='ファイル添付を有効化'
          />
          <JotaiSwitch
            atom={getCommonPropertyAtom('autoFillOnFileDrop')}
            label='ファイル添付時に自動でフィールド補完を実行'
          />
          <JotaiSwitch
            atom={getCommonPropertyAtom('autocompleteEnabled')}
            label='入力予測を有効化'
          />
        </div>
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>AIバトラーを表示する画面</PluginFormTitle>
        <PluginFormDescription last>
          AIバトラー (フローティングボタン・チャット) を表示する kintone 画面を選択します。
        </PluginFormDescription>
        <div className='flex flex-col gap-1'>
          <JotaiSwitch
            atom={getCommonPropertyAtom('displayOnIndex')}
            label='レコード一覧画面に表示'
          />
          <JotaiSwitch
            atom={getCommonPropertyAtom('displayOnDetail')}
            label='レコード詳細画面に表示'
          />
          <JotaiSwitch
            atom={getCommonPropertyAtom('displayOnCreate')}
            label='レコード作成画面に表示'
          />
          <JotaiSwitch
            atom={getCommonPropertyAtom('displayOnEdit')}
            label='レコード編集画面に表示'
          />
        </div>
      </PluginFormSection>
    </div>
  );
}

export default CommonSettingsForm;
