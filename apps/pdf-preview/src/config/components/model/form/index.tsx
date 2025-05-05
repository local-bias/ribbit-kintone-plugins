import { isConditionIdUnselectedAtom } from '@/config/states/plugin';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';

const FormContent: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle></PluginFormTitle>
        <PluginFormDescription last></PluginFormDescription>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle></PluginFormTitle>
        <PluginFormDescription last></PluginFormDescription>
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle></PluginFormTitle>
        <PluginFormDescription last></PluginFormDescription>
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
