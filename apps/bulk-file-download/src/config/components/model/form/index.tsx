import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Skeleton,
  TextField,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { appSpacesAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import type { ButtonLocation } from '@/schema/plugin-config';

import DeleteButton from './condition-delete-button';
import FieldCodesForm from './form-fields';

const buttonLocationAtom = getConditionPropertyAtom('buttonLocation');
const spaceFieldIdAtom = getConditionPropertyAtom('spaceFieldId');

function ButtonLocationSelect() {
  const [location, setLocation] = useAtom(buttonLocationAtom);
  const handleChange = (e: SelectChangeEvent) => {
    setLocation(e.target.value as ButtonLocation);
  };
  return (
    <FormControl sx={{ minWidth: 300 }}>
      <InputLabel>{t('config.buttonLocation.label')}</InputLabel>
      <Select value={location} label={t('config.buttonLocation.label')} onChange={handleChange}>
        <MenuItem value='list-header'>{t('config.buttonLocation.listHeader')}</MenuItem>
        <MenuItem value='detail-header'>{t('config.buttonLocation.detailHeader')}</MenuItem>
        <MenuItem value='space'>{t('config.buttonLocation.space')}</MenuItem>
      </Select>
    </FormControl>
  );
}

function SpaceFieldSelect() {
  const location = useAtomValue(buttonLocationAtom);
  const spaces = useAtomValue(appSpacesAtom);
  const [spaceFieldId, setSpaceFieldId] = useAtom(spaceFieldIdAtom);

  if (location !== 'space') {
    return null;
  }

  return (
    <PluginFormSection>
      <PluginFormTitle>{t('config.spaceField.title')}</PluginFormTitle>
      <PluginFormDescription last>{t('config.spaceField.description')}</PluginFormDescription>
      <TextField
        select
        value={spaceFieldId}
        onChange={(e) => setSpaceFieldId(e.target.value)}
        label={t('config.spaceField.label')}
        variant='outlined'
        sx={{ width: 300 }}
      >
        {spaces.map((space) => (
          <MenuItem key={space.elementId} value={space.elementId}>
            {space.elementId}
          </MenuItem>
        ))}
      </TextField>
    </PluginFormSection>
  );
}

function FormContent() {
  return (
    <div style={{ padding: 16 }}>
      <PluginFormSection>
        <PluginFormTitle>{t('config.buttonLabel.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.buttonLabel.description')}</PluginFormDescription>
        <JotaiText
          atom={getConditionPropertyAtom('buttonLabel')}
          label={t('config.buttonLabel.label')}
          placeholder={t('config.buttonLabel.placeholder')}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.fieldCodes.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.fieldCodes.description')}</PluginFormDescription>
        <FieldCodesForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.buttonLocation.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.buttonLocation.description')}</PluginFormDescription>
        <ButtonLocationSelect />
      </PluginFormSection>
      <Suspense fallback={<Skeleton variant='rounded' width={300} height={56} />}>
        <SpaceFieldSelect />
      </Suspense>
      <PluginFormSection>
        <PluginFormTitle>{t('config.zipFileName.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.zipFileName.description')}
          <br />
          {`{{date:yyyy-MM-dd}}`} … {t('config.zipFileName.templateDateDesc')}、
          <br />
          {`{{appName}}`} … {t('config.zipFileName.templateAppNameDesc')}、
          <br />
          {`{{appId}}`} … {t('config.zipFileName.templateAppIdDesc')}
          <br />
        </PluginFormDescription>
        <JotaiText
          atom={getConditionPropertyAtom('zipFileName')}
          label={t('config.zipFileName.label')}
          placeholder='{{appName}}_{{date:yyyy-MM-dd}}'
        />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
}

function PluginForm() {
  return <FormContent />;
  // const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  // return commonSettingsShown ? <CommonSettings /> : <FormContent />;
}

export default PluginForm;
