import FormatSupportList from '@/components/format-support-list';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Alert, Button } from '@mui/material';
import { FC } from 'react';

const Component: FC = () => (
  <div className='p-4'>
    <PluginFormSection>
      <PluginFormTitle>サポートされている変換形式</PluginFormTitle>
      <PluginFormDescription last>
        当プラグインでは、ブラウザの標準機能を使用して画像の変換を行います。そのため、変換できる形式はブラウザのバージョンや種類によって異なります。
        <br />
        以下の情報は、現在使用されているブラウザで対応している変換形式を確認するためのものです。
      </PluginFormDescription>
      <FormatSupportList />
    </PluginFormSection>
    <Alert severity='warning' className='mt-4'>
      <PluginFormDescription>
        一部のフォーマットは、kintoneのプレビュー機能に対応していない場合があります。
        <br />
        kintoneがプレビューをサポートしているフォーマットについては、以下のリンクを参照してください。
        <br />
        <a
          href='https://jp.cybozu.help/k/ja/id/040481.html#app_othersettings_set_thumbnail_10'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Button variant='text' color='inherit'>
            サムネイルが表示されるファイルの形式
          </Button>
        </a>
      </PluginFormDescription>
    </Alert>
  </div>
);

export default Component;
