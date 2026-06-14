/**
 * 添付ファイルのプレビュー種別を判定するためのユーティリティ群。
 *
 * 拡張子とMIMEタイプの両面から判定し、可能な限り多くのファイル形式を
 * それぞれに適したレンダラーへ振り分けます。
 */

/** プレビューの描画方式を表す種別 */
export type PreviewKind =
  | 'image'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'markdown'
  | 'html'
  | 'text'
  | 'spreadsheet'
  | 'document'
  | 'archive'
  | 'unsupported';

const EXTENSION_KIND_MAP: Record<string, PreviewKind> = {
  // 画像
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  avif: 'image',
  bmp: 'image',
  ico: 'image',
  svg: 'image',
  // PDF
  pdf: 'pdf',
  // 動画
  mp4: 'video',
  webm: 'video',
  ogv: 'video',
  mov: 'video',
  m4v: 'video',
  // 音声
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  oga: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
  // マークダウン
  md: 'markdown',
  markdown: 'markdown',
  mdown: 'markdown',
  // HTML
  html: 'html',
  htm: 'html',
  // 表計算
  xlsx: 'spreadsheet',
  xls: 'spreadsheet',
  xlsm: 'spreadsheet',
  xlsb: 'spreadsheet',
  csv: 'spreadsheet',
  tsv: 'spreadsheet',
  ods: 'spreadsheet',
  // 文書(Word)
  docx: 'document',
  // アーカイブ
  zip: 'archive',
  // テキスト・ソースコード
  txt: 'text',
  text: 'text',
  log: 'text',
  json: 'text',
  jsonc: 'text',
  json5: 'text',
  xml: 'text',
  yml: 'text',
  yaml: 'text',
  toml: 'text',
  ini: 'text',
  conf: 'text',
  env: 'text',
  properties: 'text',
  js: 'text',
  mjs: 'text',
  cjs: 'text',
  jsx: 'text',
  ts: 'text',
  tsx: 'text',
  css: 'text',
  scss: 'text',
  sass: 'text',
  less: 'text',
  py: 'text',
  rb: 'text',
  go: 'text',
  rs: 'text',
  java: 'text',
  kt: 'text',
  kts: 'text',
  c: 'text',
  h: 'text',
  cpp: 'text',
  hpp: 'text',
  cc: 'text',
  cs: 'text',
  php: 'text',
  swift: 'text',
  sh: 'text',
  bash: 'text',
  zsh: 'text',
  bat: 'text',
  ps1: 'text',
  sql: 'text',
  vue: 'text',
  svelte: 'text',
  astro: 'text',
  graphql: 'text',
  gql: 'text',
  dockerfile: 'text',
  gitignore: 'text',
  editorconfig: 'text',
};

/** ファイル名から拡張子（小文字・ドットなし）を取得します */
export function getExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf('.');
  if (lastDot === -1 || lastDot === normalized.length - 1) {
    return '';
  }
  return normalized.slice(lastDot + 1);
}

/** MIMEタイプからプレビュー種別を推測します（拡張子で判定できない場合の補助） */
function kindFromContentType(contentType?: string): PreviewKind | null {
  if (!contentType) return null;
  const type = contentType.toLowerCase().split(';')[0]?.trim() ?? '';

  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  if (type === 'text/markdown') return 'markdown';
  if (type === 'text/html') return 'html';
  if (type === 'text/csv' || type === 'text/tab-separated-values') return 'spreadsheet';
  if (
    type === 'application/vnd.ms-excel' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'application/vnd.oasis.opendocument.spreadsheet'
  ) {
    return 'spreadsheet';
  }
  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'document';
  }
  if (
    type === 'application/zip' ||
    type === 'application/x-zip-compressed' ||
    type === 'application/x-zip'
  ) {
    return 'archive';
  }
  if (type === 'application/json' || type === 'application/xml') return 'text';
  if (type.startsWith('text/')) return 'text';
  return null;
}

/**
 * ファイル名とMIMEタイプからプレビュー種別を判定します。
 * 拡張子による判定を優先し、判定できない場合はMIMEタイプで補完します。
 */
export function getPreviewKind(fileName: string, contentType?: string): PreviewKind {
  const extension = getExtension(fileName);
  const byExtension = EXTENSION_KIND_MAP[extension];
  if (byExtension) {
    return byExtension;
  }
  return kindFromContentType(contentType) ?? 'unsupported';
}

/** プレビュー種別の表示ラベル（日本語） */
export function getPreviewKindLabel(kind: PreviewKind): string {
  switch (kind) {
    case 'image':
      return '画像';
    case 'pdf':
      return 'PDF';
    case 'video':
      return '動画';
    case 'audio':
      return '音声';
    case 'markdown':
      return 'Markdown';
    case 'html':
      return 'HTML';
    case 'text':
      return 'テキスト';
    case 'spreadsheet':
      return '表計算';
    case 'document':
      return '文書';
    case 'archive':
      return 'アーカイブ';
    default:
      return '未対応';
  }
}

/** バイト数を人間が読みやすい単位にフォーマットします */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
