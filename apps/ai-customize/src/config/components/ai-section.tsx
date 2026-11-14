import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Alert, FormControlLabel, MenuItem, Switch, TextField } from '@mui/material';
import { useAtom, useAtomValue } from '@repo/jotai';
import { useMemo } from 'react';
import { apiKeyInputAtom, isProxyKeyRegistered, persistedEndpointAtom } from '@/config/states/ai';
import { commonPropertyAtoms } from '@/config/states/plugin';
import { buildProxyEndpoint } from '@/lib/ai/endpoint';
import { t } from '@/lib/i18n';
import type { ProviderType } from '@/schema/plugin-config';

const WIDTH = { width: 420, maxWidth: '100%' } as const;

const PROVIDERS: ProviderType[] = [
  'openai',
  'anthropic',
  'google',
  'azure-openai',
  'openrouter',
  'custom',
];

const MIN_OUTPUT_TOKENS = 256;
const MAX_OUTPUT_TOKENS = 65_536;
const MIN_TOOL_STEPS = 1;
const MAX_TOOL_STEPS = 20;

function TextSetting(props: {
  name: 'model' | 'baseUrl' | 'azureResourceName' | 'azureDeploymentName' | 'azureApiVersion';
  helperText?: string;
}) {
  const [value, setValue] = useAtom(commonPropertyAtoms[props.name]);
  return (
    <TextField
      label={t(`config.ai.${props.name}`)}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      helperText={props.helperText}
      slotProps={{ htmlInput: { spellCheck: false, autoComplete: 'off' } }}
      sx={WIDTH}
    />
  );
}

/** 送信先とAPIキーの登録状況。キーの値は表示しない(登録の有無だけ) */
function KeyStatus() {
  const providerType = useAtomValue(commonPropertyAtoms.providerType);
  const baseUrl = useAtomValue(commonPropertyAtoms.baseUrl);
  const azureResourceName = useAtomValue(commonPropertyAtoms.azureResourceName);
  const azureDeploymentName = useAtomValue(commonPropertyAtoms.azureDeploymentName);
  const azureApiVersion = useAtomValue(commonPropertyAtoms.azureApiVersion);
  const model = useAtomValue(commonPropertyAtoms.model);
  // 画面上の設定ではなく、kintoneに保存済みの送信先で判定する(インポートで書き換わらない)
  const registered = useAtomValue(persistedEndpointAtom);
  const apiKey = useAtomValue(apiKeyInputAtom);

  const endpoint = buildProxyEndpoint({
    providerType,
    baseUrl,
    azureResourceName,
    azureDeploymentName,
    azureApiVersion,
    model,
  });
  const url = endpoint.ok ? endpoint.endpoint.url : null;
  const keySaved = useMemo(
    () => url !== null && url === registered && isProxyKeyRegistered(url),
    [url, registered]
  );

  if (!endpoint.ok) {
    return <Alert severity='info'>{t(`config.ai.error.${endpoint.reason}`)}</Alert>;
  }
  const status =
    apiKey.trim() !== ''
      ? 'config.ai.key.willSave'
      : keySaved
        ? 'config.ai.key.saved'
        : registered !== '' && registered !== url
          ? 'config.ai.key.reenter'
          : 'config.ai.key.missing';
  return (
    <Alert
      severity={
        status === 'config.ai.key.saved' || status === 'config.ai.key.willSave'
          ? 'success'
          : 'warning'
      }
    >
      <div>{t(status)}</div>
      <small style={{ overflowWrap: 'anywhere' }}>
        {t('config.ai.endpoint', endpoint.endpoint.url)}
      </small>
    </Alert>
  );
}

function ProviderFields() {
  const [providerType, setProviderType] = useAtom(commonPropertyAtoms.providerType);
  return (
    <>
      <TextField
        select
        label={t('config.ai.providerType')}
        value={providerType}
        onChange={(event) => setProviderType(event.target.value as ProviderType)}
        sx={WIDTH}
      >
        {PROVIDERS.map((provider) => (
          <MenuItem key={provider} value={provider}>
            {t(`config.ai.provider.${provider}`)}
          </MenuItem>
        ))}
      </TextField>
      {providerType === 'custom' && (
        <TextSetting name='baseUrl' helperText={t('config.ai.baseUrl.help')} />
      )}
      {providerType === 'azure-openai' ? (
        <>
          <TextSetting name='azureResourceName' />
          <TextSetting name='azureDeploymentName' />
          <TextSetting name='azureApiVersion' helperText={t('config.ai.azureApiVersion.help')} />
        </>
      ) : (
        <TextSetting name='model' helperText={t('config.ai.model.help')} />
      )}
    </>
  );
}

function ApiKeyField() {
  const [apiKey, setApiKey] = useAtom(apiKeyInputAtom);
  return (
    <TextField
      type='password'
      label={t('config.ai.apiKey')}
      value={apiKey}
      onChange={(event) => setApiKey(event.target.value)}
      helperText={t('config.ai.apiKey.help')}
      slotProps={{ htmlInput: { autoComplete: 'new-password', spellCheck: false } }}
      sx={WIDTH}
    />
  );
}

function BehaviorFields() {
  const [sendsRecordToAi, setSendsRecordToAi] = useAtom(commonPropertyAtoms.sendsRecordToAi);
  const [maxToolSteps, setMaxToolSteps] = useAtom(commonPropertyAtoms.maxToolSteps);
  const [additional, setAdditional] = useAtom(commonPropertyAtoms.additionalSystemPrompt);
  const [maxOutputTokens, setMaxOutputTokens] = useAtom(commonPropertyAtoms.maxOutputTokens);
  const [temperature, setTemperature] = useAtom(commonPropertyAtoms.temperature);
  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={sendsRecordToAi}
            onChange={(_, checked) => setSendsRecordToAi(checked)}
          />
        }
        label={t('config.ai.sendsRecordToAi')}
      />
      {sendsRecordToAi && <Alert severity='warning'>{t('config.ai.sendsRecordToAi.help')}</Alert>}
      <TextField
        type='number'
        label={t('config.ai.maxToolSteps')}
        value={maxToolSteps}
        onChange={(event) => {
          const value = Math.trunc(Number(event.target.value));
          if (Number.isFinite(value)) {
            setMaxToolSteps(Math.min(Math.max(value, MIN_TOOL_STEPS), MAX_TOOL_STEPS));
          }
        }}
        slotProps={{ htmlInput: { min: MIN_TOOL_STEPS, max: MAX_TOOL_STEPS } }}
        helperText={t('config.ai.maxToolSteps.help')}
        sx={WIDTH}
      />
      <TextField
        type='number'
        label={t('config.ai.maxOutputTokens')}
        value={maxOutputTokens}
        onChange={(event) => {
          const value = Math.trunc(Number(event.target.value));
          if (Number.isFinite(value)) {
            setMaxOutputTokens(Math.min(Math.max(value, MIN_OUTPUT_TOKENS), MAX_OUTPUT_TOKENS));
          }
        }}
        slotProps={{ htmlInput: { min: MIN_OUTPUT_TOKENS, max: MAX_OUTPUT_TOKENS, step: 256 } }}
        helperText={t('config.ai.maxOutputTokens.help')}
        sx={WIDTH}
      />
      <TextField
        type='number'
        label={t('config.ai.temperature')}
        value={temperature ?? ''}
        onChange={(event) => {
          const raw = event.target.value.trim();
          const value = Number(raw);
          if (raw === '') setTemperature(null);
          else if (Number.isFinite(value)) setTemperature(Math.min(Math.max(value, 0), 2));
        }}
        slotProps={{ htmlInput: { min: 0, max: 2, step: 0.1 } }}
        helperText={t('config.ai.temperature.help')}
        sx={WIDTH}
      />
      <TextField
        multiline
        minRows={3}
        label={t('config.ai.additionalSystemPrompt')}
        value={additional}
        onChange={(event) => setAdditional(event.target.value)}
        helperText={t('config.ai.additionalSystemPrompt.help')}
        sx={{ width: 640, maxWidth: '100%' }}
      />
    </>
  );
}

/** 許可リストの内容。編集の画面はまだ無いため、インポートで変わったことに気づけるよう表示する */
function AllowListSummary() {
  const describe = (users: string[], groups: string[], organizations: string[]) =>
    users.length + groups.length + organizations.length === 0
      ? t('config.ai.allowList.adminsOnly')
      : t(
          'config.ai.allowList.configured',
          String(users.length),
          String(groups.length),
          String(organizations.length)
        );
  const chat = describe(
    useAtomValue(commonPropertyAtoms.chatAllowedUsers),
    useAtomValue(commonPropertyAtoms.chatAllowedGroups),
    useAtomValue(commonPropertyAtoms.chatAllowedOrganizations)
  );
  const publish = describe(
    useAtomValue(commonPropertyAtoms.publishAllowedUsers),
    useAtomValue(commonPropertyAtoms.publishAllowedGroups),
    useAtomValue(commonPropertyAtoms.publishAllowedOrganizations)
  );
  return (
    <Alert severity='info'>
      <div>{t('config.ai.allowList.chat', chat)}</div>
      <div>{t('config.ai.allowList.publish', publish)}</div>
      <small>{t('config.ai.allowList.note')}</small>
    </Alert>
  );
}

/**
 * AI(BYOK)の設定
 *
 * APIキーはプラグインのproxy設定へ保存し、通常の設定には書かない。送信先が変わったら入力し直す。
 * チャットを使える人は、許可リストを設定するまでアプリ管理者だけ
 *
 * @see docs/03-plugin-config.md 2-4章、docs/07b-ai-providers.md 5章
 */
export default function AiSection() {
  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.ai.title')}</PluginFormTitle>
      <PluginFormDescription>{t('config.ai.description')}</PluginFormDescription>
      <PluginFormDescription last>{t('config.ai.adminNotice')}</PluginFormDescription>
      <div className='grid gap-4'>
        <ProviderFields />
        <ApiKeyField />
        <KeyStatus />
        <BehaviorFields />
        <AllowListSummary />
      </div>
    </PluginFormSection>
  );
}
