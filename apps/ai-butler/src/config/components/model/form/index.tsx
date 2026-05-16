import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { getConditionPropertyAtom, isConditionIdUnselectedAtom } from '@/config/states/plugin';

import { TRIGGER_LABELS } from '@/lib/static';
import type { ConditionTrigger } from '@/schema/plugin-config';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import AutocompleteRulesForm from './form-autocomplete-rules';
import TargetFieldsForm from './form-target-fields';

const triggerAtom = getConditionPropertyAtom('trigger');

function TriggerSelect() {
  const [trigger, setTrigger] = useAtom(triggerAtom);
  return (
    <FormControl size='small' sx={{ minWidth: 280 }}>
      <InputLabel id='ai-butler-trigger-label'>トリガー</InputLabel>
      <Select
        labelId='ai-butler-trigger-label'
        label='トリガー'
        value={trigger}
        onChange={(event) => setTrigger(event.target.value as ConditionTrigger)}
      >
        {(['manual', 'fileDrop', 'autocomplete'] as const).map((key) => (
          <MenuItem key={key} value={key}>
            {TRIGGER_LABELS[key]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function TriggerSpecificForm() {
  const trigger = useAtomValue(triggerAtom);
  switch (trigger) {
    case 'fileDrop':
      return (
        <PluginFormSection>
          <PluginFormTitle>書き込み対象フィールド</PluginFormTitle>
          <PluginFormDescription last>
            ファイル添付時に AI が値を書き込む対象フィールドを指定します。
          </PluginFormDescription>
          <TargetFieldsForm />
        </PluginFormSection>
      );
    case 'autocomplete':
      return (
        <PluginFormSection>
          <PluginFormTitle>入力予測ルール</PluginFormTitle>
          <PluginFormDescription>
            ソースフィールドの値が入力された際に、対象フィールドへ提案する値を AI に生成させます。
          </PluginFormDescription>
          <PluginFormDescription last>
            例: 氏名 → フリガナ、英語タイトル → 日本語訳 など
          </PluginFormDescription>
          <AutocompleteRulesForm />
        </PluginFormSection>
      );
    default:
      return null;
  }
}

function FormContent() {
  return (
    <div className='p-4 flex flex-col gap-2'>
      <PluginFormSection>
        <PluginFormTitle>プロンプト名</PluginFormTitle>
        <PluginFormDescription last>
          このプロンプトテンプレートを識別するための名前です。
        </PluginFormDescription>
        <JotaiText
          atom={getConditionPropertyAtom('name')}
          label='プロンプト名'
          sx={{ minWidth: 360 }}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>説明</PluginFormTitle>
        <PluginFormDescription last>
          プロンプトの用途を説明する任意の文章です。
        </PluginFormDescription>
        <JotaiText
          atom={getConditionPropertyAtom('description')}
          label='説明'
          multiline
          minRows={2}
          maxRows={6}
          sx={{ minWidth: 600 }}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>トリガー</PluginFormTitle>
        <PluginFormDescription last>
          このプロンプトが起動するタイミングを指定します。
        </PluginFormDescription>
        <TriggerSelect />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>システムプロンプト</PluginFormTitle>
        <PluginFormDescription last>
          このプロンプト固有の system プロンプトです。空欄の場合は共通設定の値を使用します。
        </PluginFormDescription>
        <JotaiText
          atom={getConditionPropertyAtom('systemPrompt')}
          label='システムプロンプト'
          multiline
          minRows={3}
          maxRows={12}
          sx={{ minWidth: 600 }}
        />
      </PluginFormSection>
      <TriggerSpecificForm />
      <DeleteButton />
    </div>
  );
}

function PluginForm() {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
}

export default PluginForm;
