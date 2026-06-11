import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { getCommonPropertyAtom } from '@/config/states/plugin';

function CommonSettingsForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle></PluginFormTitle>
        <PluginFormDescription last></PluginFormDescription>
        <JotaiText atom={getCommonPropertyAtom('memo')} label={'$'} placeholder={'#'} />
      </PluginFormSection>
    </div>
  );
}

export default CommonSettingsForm;
