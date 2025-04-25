import { JotaiSwitch, JotaiText } from '@/components/jotai';
import {
  commonSettingsShownAtom,
  disableVanillaFileFieldAtom,
  dropzoneDescriptionAtom,
} from '@/config/states/plugin';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import CommonSettings from './common';
import DeleteButton from './condition-delete-button';
import FileFieldCodeForm from './form-field-code';
import TargetEventsForm from './form-target-events';
import ImageFormatSelectForm from './image-format-select';
import TargetSpaceIdForm from './space-select';

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
      <Accordion className='!mt-8'>
        <AccordionSummary>詳細設定</AccordionSummary>
        <AccordionDetails>
          <PluginFormSection>
            <PluginFormTitle>対象画面</PluginFormTitle>
            <PluginFormDescription>
              専用のアップロード機能を有効にする画面を選択します。
            </PluginFormDescription>
            <PluginFormDescription last>
              チェックを外した画面では、専用のアップロード機能は無効となります。(通常のアップロード機能には影響しません)
            </PluginFormDescription>
            <TargetEventsForm />
          </PluginFormSection>
          <PluginFormSection>
            <PluginFormTitle>ドラッグアンドドロップエリアの文章</PluginFormTitle>
            <PluginFormDescription last>
              プラグインを有効にした際に表示される、ドラッグアンドドロップエリア内の説明文を指定します。
            </PluginFormDescription>
            <JotaiText multiline atom={dropzoneDescriptionAtom} />
          </PluginFormSection>
          <PluginFormSection>
            <PluginFormTitle>標準のアップロードフィールドの無効化</PluginFormTitle>
            <PluginFormDescription>
              標準のファイルフィールドを使ったファイルアップロードの有効/無効を切り替えます。
            </PluginFormDescription>
            <PluginFormDescription>
              この設定を有効にすると、ユーザーはこのプラグインを通してのみ画像をアップロードできるようになります。
            </PluginFormDescription>
            <PluginFormDescription>
              変換を強制できる他、画像ファイル以外をアップロードできないようにすることができます。
            </PluginFormDescription>
            <PluginFormDescription last>
              「対象画面」で指定した画面にのみ適用されます。
            </PluginFormDescription>
            <JotaiSwitch
              atom={disableVanillaFileFieldAtom}
              label='標準のアップロードフィールドを無効にする'
            />
          </PluginFormSection>
        </AccordionDetails>
      </Accordion>
      <DeleteButton />
    </div>
  );
};

const FormContainer: FC = () => {
  const commonSettingsShown = useAtomValue(commonSettingsShownAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
};

export default FormContainer;
