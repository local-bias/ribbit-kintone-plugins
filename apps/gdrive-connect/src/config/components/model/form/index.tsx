import {
  JotaiFieldMultiSelect,
  JotaiFieldSelect,
  JotaiRadio,
  JotaiText,
} from '@konomi-app/kintone-utilities-jotai';
import {
  PluginFormDescription,
  PluginFormSection,
  PluginFormTitle,
} from '@konomi-app/kintone-utilities-react';
import { Autocomplete, Box, Skeleton, TextField } from '@mui/material';
import { useAtom, useAtomValue } from '@repo/jotai';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  currentAppFieldsAtom,
  currentAppSpaceFieldsAtom,
  currentAppTextFieldsAtom,
} from '@/config/states/kintone';
import {
  folderCreationTriggerAtom,
  folderIdFieldCodeAtom,
  folderNameFieldCodesAtom,
  getConditionPropertyAtom,
  isConditionIdUnselectedAtom,
  parentFolderIdAtom,
  targetSpaceIdAtom,
} from '@/config/states/plugin';
import { FOLDER_CREATION_TRIGGER_OPTIONS } from '@/lib/plugin';

import CommonSettings from './common';
import DeleteButton from './condition-delete-button';

function LoadingField({ width = 360 }: { width?: number } = {}) {
  return <Skeleton variant='rounded' width={width} height={56} />;
}

function FormError({ label, error }: { label: string; error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <TextField
      error
      label={label}
      helperText={`情報の取得に失敗しました: ${message}`}
      sx={{ width: 360 }}
    />
  );
}

function TargetSpaceSelectComponent() {
  const spaces = useAtomValue(currentAppSpaceFieldsAtom);
  const [targetSpaceId, setTargetSpaceId] = useAtom(targetSpaceIdAtom);

  return (
    <Autocomplete
      value={spaces.find((field) => field.elementId === targetSpaceId) ?? null}
      sx={{ width: 420, maxWidth: '100%' }}
      options={spaces}
      isOptionEqualToValue={(option, selected) => option.elementId === selected.elementId}
      getOptionLabel={(field) => field.elementId ?? ''}
      onChange={(_, field) => setTargetSpaceId(field?.elementId ?? '')}
      noOptionsText='スペースフィールドが見つかりません'
      renderOption={(props, field) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} component='li' {...optionProps}>
            <div className='grid'>
              <span>{field.elementId}</span>
              <span className='text-xs text-gray-400'>スペースフィールド</span>
            </div>
          </Box>
        );
      }}
      renderInput={(renderParams) => (
        <TextField {...renderParams} label='表示スペース' placeholder='スペースフィールドを検索' />
      )}
    />
  );
}

function TargetSpaceSelect() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => <FormError label='表示スペース' error={error} />}
    >
      <Suspense fallback={<LoadingField />}>
        <TargetSpaceSelectComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function FolderIdFieldSelectComponent() {
  const [folderIdFieldCode, setFolderIdFieldCode] = useAtom(folderIdFieldCodeAtom);
  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={currentAppTextFieldsAtom}
      fieldCode={folderIdFieldCode}
      onChange={setFolderIdFieldCode}
      label='フォルダID保存先フィールド'
      placeholder='単一行テキストフィールドを検索'
      sx={{ width: 420, maxWidth: '100%' }}
    />
  );
}

function FolderIdFieldSelect() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <FormError label='フォルダID保存先フィールド' error={error} />
      )}
    >
      <Suspense fallback={<LoadingField />}>
        <FolderIdFieldSelectComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function FolderNameFieldsSelectComponent() {
  const [folderNameFieldCodes, setFolderNameFieldCodes] = useAtom(folderNameFieldCodesAtom);
  return (
    <JotaiFieldMultiSelect
      fieldPropertiesAtom={currentAppFieldsAtom}
      fieldCodes={folderNameFieldCodes}
      onChange={setFolderNameFieldCodes}
      label='フォルダ名に使用するフィールド'
      placeholder='フォルダ名に含めるフィールドを検索'
      sx={{ width: 560, maxWidth: '100%' }}
    />
  );
}

function FolderNameFieldsSelect() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <FormError label='フォルダ名に使用するフィールド' error={error} />
      )}
    >
      <Suspense fallback={<LoadingField width={560} />}>
        <FolderNameFieldsSelectComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function FormContent() {
  return (
    <div className='p-4'>
      <PluginFormSection>
        <PluginFormTitle>メモ</PluginFormTitle>
        <PluginFormDescription last>
          このタブを識別するためのメモです。サイドバーのタブ名として表示されます。
        </PluginFormDescription>
        <JotaiText atom={getConditionPropertyAtom('memo')} />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>表示先</PluginFormTitle>
        <PluginFormDescription last>
          レコード詳細画面・編集画面に配置したスペースフィールドを選択します。
        </PluginFormDescription>
        <TargetSpaceSelect />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>Googleドライブフォルダ</PluginFormTitle>
        <PluginFormDescription last>
          レコードごとのフォルダを作成する、親フォルダのIDまたはURLを入力してください。
          このフォルダは、認証に使用するGoogleアカウントに共有しておく必要があります。
        </PluginFormDescription>
        <JotaiText
          atom={parentFolderIdAtom}
          label='親フォルダID'
          placeholder='フォルダIDまたはhttps://drive.google.com/drive/folders/...'
        />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>フォルダの作成タイミング</PluginFormTitle>
        <PluginFormDescription last>
          Googleドライブフォルダをいつ作成するかを選択します。
        </PluginFormDescription>
        <JotaiRadio atom={folderCreationTriggerAtom} options={FOLDER_CREATION_TRIGGER_OPTIONS} />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>フォルダIDの保存先</PluginFormTitle>
        <PluginFormDescription last>
          作成したGoogleドライブフォルダのIDを保存する、単一行テキストフィールドを選択してください。
        </PluginFormDescription>
        <FolderIdFieldSelect />
      </PluginFormSection>
      <PluginFormSection>
        <PluginFormTitle>フォルダ名</PluginFormTitle>
        <PluginFormDescription last>
          選択したフィールドの値を使ってフォルダ名を生成します(レコード番号は常に先頭に付与されます)。
        </PluginFormDescription>
        <FolderNameFieldsSelect />
      </PluginFormSection>
      <DeleteButton />
    </div>
  );
}

function PluginForm() {
  const commonSettingsShown = useAtomValue(isConditionIdUnselectedAtom);
  return commonSettingsShown ? <CommonSettings /> : <FormContent />;
}

export default PluginForm;
