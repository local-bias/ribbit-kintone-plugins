import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Alert, Chip } from '@mui/material';
import { useAtom, useAtomValue } from '@repo/jotai';
import { mappableFieldsAtoms, permissionsDefaultSelectedAtom } from '@/config/states/kintone';
import { commonPropertyAtoms } from '@/config/states/plugin';
import { FIELD_MAPPINGS, type FieldMapping } from '@/lib/field-mapping';
import { t } from '@/lib/i18n';
import { AsyncFormField } from './async-form-field';

type TranslationKey = Parameters<typeof t>[0];

const labelOf = (mapping: FieldMapping): string =>
  t(`config.fields.${mapping.name}.label` as TranslationKey);

function FieldMappingRow({ mapping }: { mapping: FieldMapping }) {
  const [fieldCode, setFieldCode] = useAtom(commonPropertyAtoms[mapping.key]);
  const label = labelOf(mapping);
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <AsyncFormField label={label}>
        <JotaiFieldSelect
          fieldPropertiesAtom={mappableFieldsAtoms[mapping.key]}
          fieldCode={fieldCode}
          onChange={setFieldCode}
          label={label}
          placeholder={t('config.fields.placeholder')}
          sx={{ width: 420, maxWidth: '100%' }}
        />
      </AsyncFormField>
      <Chip
        size='small'
        color={mapping.required ? 'primary' : 'default'}
        variant={mapping.required ? 'filled' : 'outlined'}
        label={t(mapping.required ? 'config.fields.required' : 'config.fields.optional')}
      />
    </div>
  );
}

/** 「権限」フィールドの初期値で書き込み権限が付くと、新規アセットが最初から書き込めてしまう */
function PermissionsDefaultWarning() {
  const selected = useAtomValue(permissionsDefaultSelectedAtom);
  return selected.length > 0 ? (
    <Alert severity='warning'>{t('config.permissions.defaultWarning')}</Alert>
  ) : null;
}

function ExternalUrlsWarning() {
  const externalUrlsFieldCode = useAtomValue(commonPropertyAtoms.externalUrlsFieldCode);
  return externalUrlsFieldCode === '' ? (
    <Alert severity='info'>{t('config.permissions.externalUrlsMissing')}</Alert>
  ) : null;
}

export default function FieldMappingSection() {
  const assetAppId = useAtomValue(commonPropertyAtoms.assetAppId);
  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.fields.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.fields.description')}</PluginFormDescription>
      {assetAppId === '' ? (
        <Alert severity='info'>{t('config.fields.selectAppFirst')}</Alert>
      ) : (
        <div className='grid gap-4'>
          {FIELD_MAPPINGS.map((mapping) => (
            <FieldMappingRow key={mapping.key} mapping={mapping} />
          ))}
          <Alert severity='info'>{t('config.permissions.caution')}</Alert>
          <AsyncFormField label={t('config.fields.permissions.label')}>
            <PermissionsDefaultWarning />
          </AsyncFormField>
          <ExternalUrlsWarning />
        </div>
      )}
    </PluginFormSection>
  );
}
