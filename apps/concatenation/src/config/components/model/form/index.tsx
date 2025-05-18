import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import DeleteButton from './condition-delete-button';
import ConcatenationItemsForm from './form-concatenation-items';
import TargetFieldForm from './form-target-field';
import { t } from '@/lib/i18n';

export default function ConditionForm() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>{t('config.targetField.title')}</PluginFormTitle>
        <PluginFormDescription last>{t('config.targetField.description')}</PluginFormDescription>
        <TargetFieldForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>{t('config.concatenationItems.title')}</PluginFormTitle>
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
