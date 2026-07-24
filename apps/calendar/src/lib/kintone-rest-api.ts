import { kintoneAPI } from '@konomi-app/kintone-utilities';

/** kintoneアプリに初期状態で存在するフィールドタイプ */
export const PREDEFINED_FIELDS: kintoneAPI.FieldPropertyType[] = [
  'RECORD_NUMBER',
  'UPDATED_TIME',
  'CREATOR',
  'CREATED_TIME',
  'CATEGORY',
  'MODIFIER',
  'STATUS',
];
