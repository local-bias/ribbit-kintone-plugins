import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { PluginCommonConfig } from '@/schema/plugin-config';

/**
 * 設定画面の「フィールドの対応付け」と「選択肢の値」の定義(純粋関数)
 *
 * @see docs/03-plugin-config.md 2章
 */

export type FieldCodeKey = Extract<keyof PluginCommonConfig, `${string}FieldCode`>;

export type FieldMapping = {
  key: FieldCodeKey;
  /** i18nのキーの中間部分(`config.fields.{name}.label`) */
  name: string;
  /** 対応付けてよいフィールドの型 */
  types: readonly kintoneAPI.FieldPropertyType[];
  required: boolean;
};

const CHOICE_TYPES = ['DROP_DOWN', 'RADIO_BUTTON'] as const;

export const FIELD_MAPPINGS: readonly FieldMapping[] = [
  { key: 'titleFieldCode', name: 'title', types: ['SINGLE_LINE_TEXT'], required: true },
  { key: 'targetAppIdFieldCode', name: 'targetAppId', types: ['NUMBER'], required: true },
  { key: 'targetSpaceIdFieldCode', name: 'targetSpaceId', types: ['NUMBER'], required: true },
  { key: 'kindFieldCode', name: 'kind', types: CHOICE_TYPES, required: true },
  { key: 'codeFieldCode', name: 'code', types: ['MULTI_LINE_TEXT'], required: true },
  { key: 'scopeFieldCode', name: 'scope', types: CHOICE_TYPES, required: true },
  { key: 'statusFieldCode', name: 'status', types: CHOICE_TYPES, required: true },
  { key: 'ownerFieldCode', name: 'owner', types: ['CREATOR'], required: true },
  { key: 'permissionsFieldCode', name: 'permissions', types: ['CHECK_BOX'], required: true },
  {
    key: 'externalUrlsFieldCode',
    name: 'externalUrls',
    types: ['MULTI_LINE_TEXT'],
    required: false,
  },
  { key: 'orderFieldCode', name: 'order', types: ['NUMBER'], required: false },
  { key: 'screensFieldCode', name: 'screens', types: ['CHECK_BOX'], required: false },
  { key: 'descriptionFieldCode', name: 'description', types: ['MULTI_LINE_TEXT'], required: false },
  {
    key: 'conversationFieldCode',
    name: 'conversation',
    types: ['MULTI_LINE_TEXT'],
    required: false,
  },
  { key: 'modelFieldCode', name: 'model', types: ['SINGLE_LINE_TEXT'], required: false },
];

export type ChoiceValueKey = Extract<keyof PluginCommonConfig, `${string}Value`>;

export type ChoiceValueMapping = {
  key: ChoiceValueKey;
  /** 選択肢を取り出すフィールド */
  fieldKey: FieldCodeKey;
  /** i18nのキーの末尾(`config.values.{name}`) */
  name: string;
};

export const CHOICE_VALUE_MAPPINGS: readonly ChoiceValueMapping[] = [
  { key: 'kindJsValue', fieldKey: 'kindFieldCode', name: 'kindJs' },
  { key: 'kindCssValue', fieldKey: 'kindFieldCode', name: 'kindCss' },
  { key: 'scopePrivateValue', fieldKey: 'scopeFieldCode', name: 'scopePrivate' },
  { key: 'scopePublicValue', fieldKey: 'scopeFieldCode', name: 'scopePublic' },
  { key: 'statusEnabledValue', fieldKey: 'statusFieldCode', name: 'statusEnabled' },
  { key: 'statusDisabledValue', fieldKey: 'statusFieldCode', name: 'statusDisabled' },
  { key: 'screenIndexValue', fieldKey: 'screensFieldCode', name: 'screenIndex' },
  { key: 'screenDetailValue', fieldKey: 'screensFieldCode', name: 'screenDetail' },
  { key: 'screenCreateValue', fieldKey: 'screensFieldCode', name: 'screenCreate' },
  { key: 'screenEditValue', fieldKey: 'screensFieldCode', name: 'screenEdit' },
  { key: 'permissionPostValue', fieldKey: 'permissionsFieldCode', name: 'permissionPost' },
  { key: 'permissionPutValue', fieldKey: 'permissionsFieldCode', name: 'permissionPut' },
  { key: 'permissionDeleteValue', fieldKey: 'permissionsFieldCode', name: 'permissionDelete' },
  {
    key: 'permissionExternalListedValue',
    fieldKey: 'permissionsFieldCode',
    name: 'permissionExternalListed',
  },
  {
    key: 'permissionExternalAllValue',
    fieldKey: 'permissionsFieldCode',
    name: 'permissionExternalAll',
  },
  {
    key: 'permissionUnrestrictedValue',
    fieldKey: 'permissionsFieldCode',
    name: 'permissionUnrestricted',
  },
];

/** 型が合うフィールドだけを返します */
export const filterFieldsByTypes = (
  fields: readonly kintoneAPI.FieldProperty[],
  types: readonly kintoneAPI.FieldPropertyType[]
): kintoneAPI.FieldProperty[] => fields.filter((field) => types.includes(field.type));

type OptionsProperty = { options?: Record<string, { label: string; index: string | number }> };

/** 選択肢を持つフィールドの選択肢を、表示順で返します */
export const getFieldOptions = (field: kintoneAPI.FieldProperty | undefined): string[] => {
  const options = (field as OptionsProperty | undefined)?.options;
  if (!options) {
    return [];
  }
  return Object.values(options)
    .sort((a, b) => Number(a.index) - Number(b.index))
    .map((option) => option.label);
};

/** チェックボックスの初期値で選択されている選択肢を返します */
export const getDefaultSelectedOptions = (
  field: kintoneAPI.FieldProperty | undefined
): string[] => {
  const defaultValue = (field as { defaultValue?: unknown } | undefined)?.defaultValue;
  return Array.isArray(defaultValue)
    ? defaultValue.filter((value): value is string => typeof value === 'string')
    : [];
};

/**
 * 更新日時フィールドのコードを返します。無ければ空文字
 *
 * パネルの一覧に「3日前」のような更新日時を出すため。設定画面で対応付けさせず、フィールドの型で探す
 */
export const findUpdatedTimeFieldCode = (fields: readonly kintoneAPI.FieldProperty[]): string =>
  fields.find((field) => field.type === 'UPDATED_TIME')?.code ?? '';
