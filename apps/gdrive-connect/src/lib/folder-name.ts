import type { kintoneAPI } from '@konomi-app/kintone-utilities';

const stringifyFieldValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(stringifyFieldValue).filter(Boolean).join(',');
  }
  if (typeof value === 'object') {
    if ('name' in value && typeof (value as { name: unknown }).name === 'string') {
      return (value as { name: string }).name;
    }
    if ('code' in value && typeof (value as { code: unknown }).code === 'string') {
      return (value as { code: string }).code;
    }
    return '';
  }
  return String(value);
};

/**
 * レコードに対応するGoogleドライブフォルダの表示名を組み立てます
 *
 * レコード番号(`$id`)を常に先頭に含めることで、フォルダ名のみに依存せず一意性を確保します
 */
export const buildFolderName = (params: {
  fieldCodes: string[];
  record: kintoneAPI.RecordData;
}): string => {
  const { fieldCodes, record } = params;
  const recordId = record.$id?.value ? `#${record.$id.value}` : '';

  const labelParts = fieldCodes
    .map((code) => stringifyFieldValue(record[code]?.value))
    .filter((part) => part !== '');

  const parts = [recordId, ...labelParts].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : recordId || 'record';
};
