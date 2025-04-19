import FormatSupportList from '@/components/format-support-list';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { FC } from 'react';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle>サポートされている変換形式</PluginFormTitle>
      <PluginFormDescription last>
        当プラグインでは、ブラウザ標準の機能を使用して、画像の変換を行います。
        <br />
        現在使用しているブラウザのバージョンによっては、変換できない場合があります。
        <br />
        以下の情報は、現在使用されているブラウザで対応している変換形式を確認するためのものです。
      </PluginFormDescription>
      <FormatSupportList />
    </PluginFormSection>
  </div>
);

export default Component;
