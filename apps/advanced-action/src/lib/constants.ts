import { kintoneAPI } from '@konomi-app/kintone-utilities';
import config from 'plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

/**
 * このプラグインで使用するURLクエリパラメータのキー
 */
export const QUERY_PARAM_KEY = 'raact_params';

export const FIELD_TYPES_NOT_SUPPORTED = [
  // 'FILE',
  'REFERENCE_TABLE',
] as const satisfies kintoneAPI.FieldPropertyType[];

export function filterUnsupportedFieldTypes(field: kintoneAPI.FieldProperty): boolean {
  // @ts-expect-error field apiとfield property apiの型が異なるため
  return !FIELD_TYPES_NOT_SUPPORTED.includes(field.type);
}
