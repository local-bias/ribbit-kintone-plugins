import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';

function CommonSettingsForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>共通メモ</PluginFormTitle>
        <PluginFormDescription last>設定全体の管理用メモです。</PluginFormDescription>
        {/* <JotaiText atom={getCommonPropertyAtom('memo')} label='メモ' placeholder='任意のメモ' /> */}
      </PluginFormSection>
    </div>
  );
}

export default CommonSettingsForm;
