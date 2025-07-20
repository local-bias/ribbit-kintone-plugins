import { JotaiColorPicker } from '@/lib/components/jotai-color-picker';
import { JotaiText } from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import React, { FC } from 'react';
import { conditionLabelAtom, getConditionPropertyAtom } from '../../states/plugin';
import DeleteButton from './condition-delete-button';
import EmojiForm from './form-emoji';
import FieldCodeForm from './form-fieldcode';
import IconColorForm from './form-icon-color';
import IconTypeForm from './form-icon-type';
import TargetEventsForm from './form-target-events';
import TypeForm from './form-type';
import Preview from './preview';

const Component: FC = () => {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>フィールドコード</PluginFormTitle>
        <PluginFormDescription last>
          ラベルを表示するフィールドのフィールドコードを選択してください。
        </PluginFormDescription>
        <FieldCodeForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>表示するヒント</PluginFormTitle>
        <PluginFormDescription>
          フィールドに表示されたアイコンにカーソルを合わせると表示されるヒントの内容を入力してください。
        </PluginFormDescription>
        <PluginFormDescription last>
          HTMLによる記述が可能です。例えば、リンクや画像を埋め込むことができます。
        </PluginFormDescription>
        <JotaiText
          atom={conditionLabelAtom}
          label='表示するヒント'
          multiline
          rows={6}
          fullWidth
          sx={{ width: '100%' }}
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>対象画面</PluginFormTitle>
        <PluginFormDescription>ツールチップを表示する画面を制御します</PluginFormDescription>
        <PluginFormDescription last>
          チェックを外した画面では、ツールチップは表示されません。
        </PluginFormDescription>
        <TargetEventsForm />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>アイコンタイプ</PluginFormTitle>
        <PluginFormDescription>
          フィールドに表示されるアイコンのタイプを選択してください。
        </PluginFormDescription>
        <PluginFormDescription last>
          プラグイン既定のアイコン、もしくは任意の絵文字を選択することができます。
        </PluginFormDescription>
        <TypeForm />
      </PluginFormSection>
      <IconTypeForm />
      <IconColorForm />
      <EmojiForm />
      <PluginFormSection>
        <PluginFormTitle>ツールチップのデザイン: 背景色</PluginFormTitle>
        <PluginFormDescription last>
          アイコンをフォーカスした際に表示されるツールチップの背景色を設定してください。
        </PluginFormDescription>
        <JotaiColorPicker
          atom={getConditionPropertyAtom('backgroundColor')}
          variant='outlined'
          color='primary'
          label='背景色'
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>ツールチップのデザイン: テキストの色</PluginFormTitle>
        <PluginFormDescription last>
          アイコンをフォーカスした際に表示されるツールチップのテキストの色を設定してください。
        </PluginFormDescription>
        <JotaiColorPicker
          atom={getConditionPropertyAtom('foregroundColor')}
          variant='outlined'
          color='primary'
          label='テキストの色'
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>プレビュー</PluginFormTitle>
        <PluginFormDescription>以下に設定した内容をプレビューします。</PluginFormDescription>
        <PluginFormDescription last>
          環境の違いにより、画面によっては全く同じ表示にならない可能性がある点に注意してください。
        </PluginFormDescription>
        <Preview />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
};

export default Component;
