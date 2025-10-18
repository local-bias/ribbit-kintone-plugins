import { getConditionPropertyAtom } from '@/config/states/plugin';
import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import AppSelector from './app-selector';

/**
 * ページモードに応じて表示するフィールド
 */
const PageModeFields: FC = () => {
  const pageMode = useAtomValue(getConditionPropertyAtom('pageMode'));

  if (pageMode === 'url') {
    return (
      <PluginFormSection>
        <PluginFormTitle>URL</PluginFormTitle>
        <PluginFormDescription last>開きたいURLを入力します</PluginFormDescription>
        <JotaiText atom={getConditionPropertyAtom('url')} placeholder='https://example.com' />
      </PluginFormSection>
    );
  }

  if (pageMode === 'app') {
    return (
      <PluginFormSection>
        <PluginFormTitle>アプリ</PluginFormTitle>
        <PluginFormDescription last>開きたいアプリを選択します</PluginFormDescription>
        <AppSelector />
      </PluginFormSection>
    );
  }

  return null;
};

export default PageModeFields;
