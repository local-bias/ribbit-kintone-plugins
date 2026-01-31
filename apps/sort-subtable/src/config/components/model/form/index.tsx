import React, { FC } from 'react';

import FieldsForm from './form-fields';
import {
  PluginFormSection,
  PluginFormTitle,
  PluginFormDescription,
} from '@konomi-app/kintone-utility-component';

const Component: FC = () => {
  return (
    <div className='px-4'>
      <PluginFormSection>
        <PluginFormTitle>ソートを適用しないサブテーブル</PluginFormTitle>
        <PluginFormDescription>
          ここで指定したサブテーブルは、ソートが適用されないようになります。
        </PluginFormDescription>
        <PluginFormDescription last>
          <span className='text-red-600'>
            全てのサブテーブルを対象とする場合は、設定を変更する必要はありません。
          </span>
        </PluginFormDescription>
        <FieldsForm />
      </PluginFormSection>
    </div>
  );
};

export default Component;
