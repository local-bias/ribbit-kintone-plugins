import { isMobile } from '@konomi-app/kintone-utilities';

/** 現在のアプリにおける、指定したレコードの詳細画面のURLを返します */
export const getRecordDetailUrl = (recordId: string): string =>
  `${location.pathname}show${isMobile() ? '?' : '#'}record=${encodeURIComponent(recordId)}`;
