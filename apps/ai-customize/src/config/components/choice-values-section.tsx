import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { MenuItem, TextField } from '@mui/material';
import { atom, useAtom, useAtomValue } from '@repo/jotai';
import { choiceOptionsAtoms } from '@/config/states/kintone';
import { commonPropertyAtoms } from '@/config/states/plugin';
import { CHOICE_VALUE_MAPPINGS, type ChoiceValueMapping } from '@/lib/field-mapping';
import { t } from '@/lib/i18n';
import { AsyncFormField } from './async-form-field';

type TranslationKey = Parameters<typeof t>[0];

/** 選択肢を持つフィールドが対応付けられていない項目用 */
const emptyOptionsAtom = atom(async (): Promise<string[]> => []);

/**
 * 選択肢の値を、対応付けたフィールドの選択肢から選ばせます
 *
 * 手入力にすると必ずtypoで壊れるため、プルダウンにする。
 * 保存済みの値が選択肢に無い場合(フィールド側が後から変わった場合)は赤字で示す。保存はブロックしない
 */
function ChoiceValueSelect({ mapping }: { mapping: ChoiceValueMapping }) {
  const [value, setValue] = useAtom(commonPropertyAtoms[mapping.key]);
  const fieldCode = useAtomValue(commonPropertyAtoms[mapping.fieldKey]);
  const options = useAtomValue(choiceOptionsAtoms[mapping.fieldKey] ?? emptyOptionsAtom);
  const label = t(`config.values.${mapping.name}` as TranslationKey);
  const isMissing = value !== '' && options.length > 0 && !options.includes(value);
  const choices = isMissing ? [...options, value] : options;

  return (
    <TextField
      select
      label={label}
      value={choices.includes(value) ? value : ''}
      onChange={(event) => setValue(event.target.value)}
      disabled={fieldCode === '' || options.length === 0}
      error={isMissing}
      helperText={
        fieldCode === ''
          ? t('config.values.selectFieldFirst')
          : isMissing
            ? t('config.values.missing')
            : undefined
      }
      sx={{ width: 420, maxWidth: '100%' }}
    >
      {choices.map((choice) => (
        <MenuItem key={choice} value={choice}>
          {choice}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default function ChoiceValuesSection() {
  const assetAppId = useAtomValue(commonPropertyAtoms.assetAppId);
  if (assetAppId === '') {
    return null;
  }
  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.values.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.values.description')}</PluginFormDescription>
      <div className='grid gap-4'>
        {CHOICE_VALUE_MAPPINGS.map((mapping) => (
          <AsyncFormField
            key={mapping.key}
            label={t(`config.values.${mapping.name}` as TranslationKey)}
          >
            <ChoiceValueSelect mapping={mapping} />
          </AsyncFormField>
        ))}
      </div>
    </PluginFormSection>
  );
}
