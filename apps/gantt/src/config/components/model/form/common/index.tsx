import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import type { FC } from 'react';
import { getConditionPropertyAtom } from '@/config/states/plugin';

const Component: FC = () => (
  <div style={{ padding: 16 }}>
    <PluginFormSection>
      <PluginFormTitle>共通設定メモ</PluginFormTitle>
      <PluginFormDescription last>
        すべての条件に共通するメモを入力してください。
      </PluginFormDescription>
      <JotaiText
        atom={getConditionPropertyAtom('memo')}
        label='共通メモ'
        placeholder='メモを入力'
      />
    </PluginFormSection>
  </div>
);

export default Component;
