import React, { FC } from 'react';

import {
  PluginFormSection,
  PluginFormTitle,
  PluginFormDescription,
} from '@konomi-app/kintone-utilities-react';
import DeleteButton from './condition-delete-button';
import TargetFieldForm from './form-target-field';
import ConcatenationItemsForm from './form-concatenation-items';

export default function ConditionForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>対象フィールド</PluginFormTitle>
        <PluginFormDescription last>
          結合した結果を格納するフィールドを選択してください。
        </PluginFormDescription>
        <TargetFieldForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>結合設定</PluginFormTitle>
        <PluginFormDescription>
          文字列やフィールド情報を結合する設定を行います。
        </PluginFormDescription>
        <PluginFormDescription last>
          日付、日時、時刻フィールドのフォーマットについては
          <a
            href='https://moment.github.io/luxon/#/formatting?id=table-of-tokens'
            target='_blank'
            rel='noopener noreferrer'
          >
            Luxonのドキュメント
          </a>
          を参照してください。
        </PluginFormDescription>
        <ConcatenationItemsForm />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
}
