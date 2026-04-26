import styled from '@emotion/styled';
import { JotaiTogglePanel } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import type { FC } from 'react';
import { JotaiSwitch, JotaiText } from '@/components/jotai';
import { JotaiSelect } from '@/components/jotai/select';
import {
  commonSettingsShownAtom,
  idRegenerateButtonLabelAtom,
  isBulkRegenerateButtonLimitedAtom,
  isBulkRegenerateButtonShownAtom,
  isFieldDisabledAtom,
  isIDRegenerateButtonShownAtom,
  modeAtom,
} from '@/config/states/plugin';
import { t } from '@/lib/i18n';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import BulkRegenerateButtonShownUsersForm from './form-bulk-regenerate-button-shown-users';
import CustomIDRulesForm from './form-custom-rules';
import FieldsForm from './form-fields';
import IdRegenerateButtonShownEventsForm from './form-id-regenerate-button-shown-events';
import IdRegenerateButtonSpaceIdForm from './form-id-regenerate-button-space-id';
import Preview from './preview';

const FormPadding = styled.div`
  padding: 16px;
`;

const TogglePanelStyle = {
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  marginLeft: '16px',
  marginTop: '8px',
  borderLeft: '1px solid hsl(var(--ribbit-border))',
};

const SectionHeading = styled.h3`
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
`;

const FormContent: FC = () => {
  return (
    <FormPadding>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.fieldCode.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.fieldCode.description')}
        </PluginFormDescription>
        <FieldsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.isFieldDisabled.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.isFieldDisabled.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={isFieldDisabledAtom}
          label={t('config.condition.isFieldDisabled.label')}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.mode.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.condition.mode.description')}</PluginFormDescription>
        <JotaiSelect
          /** @ts-expect-error 型定義不足 */
          atom={modeAtom}
          options={[
            { label: 'nanoid', value: 'nanoid' },
            { label: 'uuid', value: 'uuid' },
            { label: 'ランダム', value: 'random' },
            { label: 'カスタム', value: 'custom' },
          ]}
          label={t('config.condition.mode.label')}
          placeholder={t('config.condition.mode.placeholder')}
        />
      </PluginFormSection>
      <CustomIDRulesForm />
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.isIDRegenerateButtonShown.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.isIDRegenerateButtonShown.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={isIDRegenerateButtonShownAtom}
          label={t('config.condition.isIDRegenerateButtonShown.label')}
        />
        <JotaiTogglePanel style={TogglePanelStyle} atom={isIDRegenerateButtonShownAtom}>
          <PluginFormSection>
            <SectionHeading>{t('config.condition.idRegenerateButtonSpaceId.title')}</SectionHeading>
            <PluginFormDescription last>
              {t('config.condition.isIDRegenerateButtonShown.description')}
            </PluginFormDescription>
            <IdRegenerateButtonSpaceIdForm />
          </PluginFormSection>

          <PluginFormSection>
            <SectionHeading>{t('config.condition.idRegenerateButtonLabel.title')}</SectionHeading>
            <PluginFormDescription last>
              {t('config.condition.idRegenerateButtonLabel.description')}
            </PluginFormDescription>
            <JotaiText
              atom={idRegenerateButtonLabelAtom}
              label={t('config.condition.idRegenerateButtonLabel.label')}
              placeholder={t('config.condition.idRegenerateButtonLabel.placeholder')}
            />
          </PluginFormSection>

          <PluginFormSection>
            <SectionHeading>
              {t('config.condition.idRegenerateButtonShownEvents.title')}
            </SectionHeading>
            <PluginFormDescription last>
              {t('config.condition.idRegenerateButtonShownEvents.description')}
            </PluginFormDescription>
            <IdRegenerateButtonShownEventsForm />
          </PluginFormSection>
        </JotaiTogglePanel>
      </PluginFormSection>
      {/* <PluginFormSection>
        <PluginFormTitle>
          {t('config.condition.isIDRegeneratedOnRecordReuse.title')}
        </PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.isIDRegeneratedOnRecordReuse.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={getConditionPropertyAtom('isIDRegeneratedOnRecordReuse')}
          label={t('config.condition.isIDRegeneratedOnRecordReuse.label')}
        />
      </PluginFormSection> */}
      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.isBulkRegenerateButtonShown.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.isBulkRegenerateButtonShown.description')}
        </PluginFormDescription>
        <JotaiSwitch
          atom={isBulkRegenerateButtonShownAtom}
          label={t('config.condition.isBulkRegenerateButtonShown.label')}
        />

        <JotaiTogglePanel style={TogglePanelStyle} atom={isBulkRegenerateButtonShownAtom}>
          <PluginFormSection>
            <SectionHeading>
              {t('config.condition.isBulkRegenerateButtonLimited.title')}
            </SectionHeading>
            <PluginFormDescription last>
              {t('config.condition.isBulkRegenerateButtonLimited.description')}
            </PluginFormDescription>
            <JotaiSwitch
              atom={isBulkRegenerateButtonLimitedAtom}
              label={t('config.condition.isBulkRegenerateButtonLimited.label')}
            />

            <JotaiTogglePanel style={TogglePanelStyle} atom={isBulkRegenerateButtonLimitedAtom}>
              <PluginFormSection>
                <SectionHeading>
                  {t('config.condition.bulkRegenerateButtonShownUsers.title')}
                </SectionHeading>
                <PluginFormDescription last>
                  {t('config.condition.bulkRegenerateButtonShownUsers.description')}
                </PluginFormDescription>
                <BulkRegenerateButtonShownUsersForm />
              </PluginFormSection>
            </JotaiTogglePanel>
          </PluginFormSection>
        </JotaiTogglePanel>
      </PluginFormSection>

      <PluginFormSection>
        <PluginFormTitle>{t('config.condition.preview.title')}</PluginFormTitle>
        <PluginFormDescription last>
          {t('config.condition.preview.description')}
        </PluginFormDescription>
        <Preview />
      </PluginFormSection>

      <DeleteButton />
    </FormPadding>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(commonSettingsShownAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
