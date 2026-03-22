import { logAppTextPropertiesState } from '@/config/states/kintone';
import {
  logAppAssistantIdFieldCodeAtom,
  logAppContentFieldCodeAtom,
  logAppRoleFieldCodeAtom,
  logAppSessionIdFieldCodeAtom,
} from '@/config/states/plugin';
import { PluginFormDescription } from '@konomi-app/kintone-utilities-react';
import { Skeleton } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { AutocompleteFieldInput } from './autocomplete-field-input';

function LogV2FieldsFormComponent() {
  const fields = useAtomValue(logAppTextPropertiesState);

  const [sessionIdFieldCode, setSessionIdFieldCode] = useAtom(logAppSessionIdFieldCodeAtom);
  const [assistantIdFieldCode, setAssistantIdFieldCode] = useAtom(logAppAssistantIdFieldCodeAtom);
  const [roleFieldCode, setRoleFieldCode] = useAtom(logAppRoleFieldCodeAtom);
  const [contentFieldCode, setContentFieldCode] = useAtom(logAppContentFieldCodeAtom);

  return (
    <>
      <PluginFormDescription>
        ログを保存するために必要なフィールドを指定してください。レコードの追加操作のみ行うため、すべてのフィールドが任意となります。
      </PluginFormDescription>
      <PluginFormDescription last>
        各フィールドは文字列型(1行テキストまたは複数行テキスト)を選択してください。
      </PluginFormDescription>

      <div className='grid gap-4'>
        <AutocompleteFieldInput
          fields={fields}
          fieldCode={sessionIdFieldCode ?? ''}
          onChange={setSessionIdFieldCode}
          label='セッションIDフィールド'
        />

        <AutocompleteFieldInput
          fields={fields}
          fieldCode={assistantIdFieldCode ?? ''}
          onChange={setAssistantIdFieldCode}
          label='アシスタントIDフィールド'
        />

        <AutocompleteFieldInput
          fields={fields}
          fieldCode={roleFieldCode ?? ''}
          onChange={setRoleFieldCode}
          label='ロール(user/assistant/fact-check)フィールド'
        />

        <AutocompleteFieldInput
          fields={fields}
          fieldCode={contentFieldCode ?? ''}
          onChange={setContentFieldCode}
          label='メッセージ内容フィールド'
        />
      </div>
    </>
  );
}

export default function LogV2FieldsForm() {
  return (
    <div className='mb-4'>
      <Suspense fallback={<Skeleton variant='rectangular' width={210} height={118} />}>
        <LogV2FieldsFormComponent />
      </Suspense>
    </div>
  );
}
