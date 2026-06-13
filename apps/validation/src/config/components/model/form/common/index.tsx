import { JotaiSwitch, JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from '@repo/jotai';
import type { FC } from 'react';
import { csvImportButtonLabelAtom, csvImportEnabledAtom } from '@/config/states/plugin';

const CommonSettings: FC = () => {
  const csvImportEnabled = useAtomValue(csvImportEnabledAtom);
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>CSVインポート（入力チェック付き）</PluginFormTitle>
        <PluginFormDescription last>
          有効にすると、一覧画面にCSVインポートボタンを表示します。
          kintone標準のCSV形式でファイルを読み込み、すべてのレコードに入力チェックを適用してから登録します。
        </PluginFormDescription>
        <JotaiSwitch atom={csvImportEnabledAtom} label='CSVインポート機能を有効にする' />
      </PluginFormSection>
      {csvImportEnabled && (
        <PluginFormSection>
          <PluginFormTitle>ボタンラベル</PluginFormTitle>
          <PluginFormDescription last>
            一覧画面に表示するインポートボタンの文言を設定してください。
          </PluginFormDescription>
          <JotaiText
            atom={csvImportButtonLabelAtom}
            placeholder='CSVインポート（入力チェック付き）'
          />
        </PluginFormSection>
      )}
    </div>
  );
};

export default CommonSettings;
