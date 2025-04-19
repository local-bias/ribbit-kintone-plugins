import { commonSettingsShownAtom } from '@/config/states/plugin';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import FileFieldCodeForm from './form-field-code';
import TargetSpaceIdForm from './space-select';
import ImageFormatSelectForm from './image-format-select';

const FormContent: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>アップロード先のファイルフィールド</PluginFormTitle>
        <PluginFormDescription last>
          変換した画像ファイルを保存するファイルフィールドを指定します。
        </PluginFormDescription>
        <FileFieldCodeForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>対象スペースフィールド</PluginFormTitle>
        <PluginFormDescription last>
          専用の変換・アップロードを行うフォームを設置するスペースのスペースIDを指定します。
        </PluginFormDescription>
        <TargetSpaceIdForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>変換する画像フォーマット</PluginFormTitle>
        <PluginFormDescription last>
          アップロードされた画像を変換するフォーマットを指定します。
        </PluginFormDescription>
        <ImageFormatSelectForm />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(commonSettingsShownAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
