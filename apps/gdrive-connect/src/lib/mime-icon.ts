export type DriveIconCategory =
  | 'folder'
  | 'image'
  | 'pdf'
  | 'spreadsheet'
  | 'document'
  | 'presentation'
  | 'archive'
  | 'video'
  | 'audio'
  | 'other';

/**
 * Googleネイティブ形式(ドキュメント/スプレッドシート/スライド)のMIMEタイプ
 *
 * アイコン分類(このファイル)と、プレビューURLの構築(`lib/drive.ts`の`buildPreviewUrl`)の
 * 両方から参照される、単一の情報源。両者は目的が異なるため分類ロジック自体は共有しない
 * (アイコン分類はWord文書等も同じ"document"カテゴリにまとめるが、プレビューURLの構築は
 * Googleドキュメント以外をdocs.google.com側のURLに誤って振り分けないよう厳密な完全一致が必要)。
 */
export const GOOGLE_NATIVE_MIME_TYPES = {
  document: 'application/vnd.google-apps.document',
  spreadsheet: 'application/vnd.google-apps.spreadsheet',
  presentation: 'application/vnd.google-apps.presentation',
} as const;

const MIME_PREFIX_CATEGORY_MAP: [prefix: string, category: DriveIconCategory][] = [
  ['application/vnd.google-apps.folder', 'folder'],
  ['image/', 'image'],
  ['video/', 'video'],
  ['audio/', 'audio'],
  ['application/pdf', 'pdf'],
  [GOOGLE_NATIVE_MIME_TYPES.spreadsheet, 'spreadsheet'],
  ['application/vnd.ms-excel', 'spreadsheet'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml', 'spreadsheet'],
  [GOOGLE_NATIVE_MIME_TYPES.presentation, 'presentation'],
  ['application/vnd.ms-powerpoint', 'presentation'],
  ['application/vnd.openxmlformats-officedocument.presentationml', 'presentation'],
  [GOOGLE_NATIVE_MIME_TYPES.document, 'document'],
  ['application/msword', 'document'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml', 'document'],
  ['text/', 'document'],
  ['application/zip', 'archive'],
  ['application/x-7z-compressed', 'archive'],
  ['application/x-rar-compressed', 'archive'],
  ['application/x-tar', 'archive'],
  ['application/gzip', 'archive'],
];

/**
 * MIMEタイプから、表示に使用するアイコンの種別を判定します
 *
 * Google Driveの`thumbnailLink`/`iconLink`はクロスオリジン画像となりkintoneのCSP制約を受けうるため
 * 取得・表示せず、ローカルアイコンにマッピングして表示します
 */
export const getIconCategory = (mimeType: string): DriveIconCategory => {
  const match = MIME_PREFIX_CATEGORY_MAP.find(([prefix]) => mimeType.startsWith(prefix));
  return match?.[1] ?? 'other';
};
