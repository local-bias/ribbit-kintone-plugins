import * as XLSX from 'xlsx';

/** 変換後テキストの最大文字数（超過時は末尾を省略） */
const MAX_TEXT_LENGTH = 100_000;

const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls', '.ods']);
const TEXT_EXTENSIONS = new Set([
  '.txt',
  '.csv',
  '.tsv',
  '.log',
  '.md',
  '.json',
  '.xml',
  '.yaml',
  '.yml',
]);

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet',
]);

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

/**
 * Excelファイル (.xlsx, .xls, .ods) かどうかを判定する
 */
export function isExcelFile(file: File): boolean {
  return EXCEL_EXTENSIONS.has(getExtension(file.name)) || EXCEL_MIME_TYPES.has(file.type);
}

/**
 * テキスト系ファイル (.txt, .csv, .tsv など) かどうかを判定する
 */
export function isTextFile(file: File): boolean {
  return TEXT_EXTENSIONS.has(getExtension(file.name)) || file.type.startsWith('text/');
}

/**
 * クライアント側でテキストに変換可能なファイルかどうかを判定する
 */
export function isConvertibleFile(file: File): boolean {
  return isExcelFile(file) || isTextFile(file);
}

/**
 * UTF-8として有効なバイト列かどうかを判定する
 */
function isValidUtf8(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; ) {
    const byte = bytes[i];
    if (byte <= 0x7f) {
      i++;
    } else if ((byte & 0xe0) === 0xc0) {
      if (i + 1 >= bytes.length || (bytes[i + 1] & 0xc0) !== 0x80) return false;
      i += 2;
    } else if ((byte & 0xf0) === 0xe0) {
      if (i + 2 >= bytes.length || (bytes[i + 1] & 0xc0) !== 0x80 || (bytes[i + 2] & 0xc0) !== 0x80)
        return false;
      i += 3;
    } else if ((byte & 0xf8) === 0xf0) {
      if (
        i + 3 >= bytes.length ||
        (bytes[i + 1] & 0xc0) !== 0x80 ||
        (bytes[i + 2] & 0xc0) !== 0x80 ||
        (bytes[i + 3] & 0xc0) !== 0x80
      )
        return false;
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}

/**
 * バイト列からテキストエンコーディングを自動判定する
 *
 * 判定順序:
 * 1. UTF-8 / UTF-16 の BOM を確認
 * 2. UTF-8 バイト列の妥当性チェック
 * 3. 上記いずれにも該当しない場合は Shift-JIS にフォールバック
 */
function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // BOM
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';

  // UTF-8 validation
  if (isValidUtf8(bytes)) return 'utf-8';

  // Shift-JIS fallback
  return 'shift-jis';
}

/**
 * テキストが長すぎる場合に末尾を省略する
 */
function truncateIfNeeded(text: string, fileName: string): string {
  if (text.length <= MAX_TEXT_LENGTH) return text;
  return text.slice(0, MAX_TEXT_LENGTH) + `\n\n...(${fileName} の内容が長いため省略されました)`;
}

/**
 * Excelファイルをテキストに変換する
 *
 * 各シートをTSV形式に変換し、コードブロックで囲んで出力する。
 * 複数シートがある場合はシート名をヘッダーとして付与する。
 */
export async function convertExcelToText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const parts: string[] = [`📁 ${file.name}`];
  const multiSheet = workbook.SheetNames.length > 1;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    if (multiSheet) {
      parts.push(`### シート: ${sheetName}`);
    }

    const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });
    if (tsv.trim()) {
      parts.push('```\n' + tsv + '\n```');
    } else {
      parts.push('(空のシート)');
    }
  }

  return truncateIfNeeded(parts.join('\n\n'), file.name);
}

/**
 * テキストファイルを文字列に変換する
 *
 * エンコーディング (UTF-8 / Shift-JIS) を自動判定してデコードする。
 */
export async function convertTextFileToString(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const encoding = detectEncoding(buffer);
  const decoder = new TextDecoder(encoding);
  const text = decoder.decode(buffer);

  const result = `📁 ${file.name}\n\`\`\`\n${text}\n\`\`\``;

  return truncateIfNeeded(result, file.name);
}

/**
 * ファイルをテキストに変換する（Excel / テキスト対応）
 *
 * @throws サポートされていないファイル形式が渡された場合
 */
export async function convertFileToText(file: File): Promise<string> {
  if (isExcelFile(file)) return convertExcelToText(file);
  if (isTextFile(file)) return convertTextFileToString(file);
  throw new Error(`サポートされていないファイル形式です: ${file.name}`);
}

/**
 * テキスト文字列を text/plain の Data URL に変換する
 */
function textToDataUrl(text: string): string {
  const encoded = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < encoded.length; i++) {
    binary += String.fromCharCode(encoded[i]);
  }
  return `data:text/plain;base64,${btoa(binary)}`;
}

/**
 * ファイルをテキストに変換し、Data URL 形式の添付情報を返す
 *
 * 変換後は `.txt` の file-base64 添付として扱えるため、
 * チャット画面上にはテキスト内容が直接表示されない。
 */
export async function convertFileToAttachment(
  file: File
): Promise<{ dataUrl: string; mimeType: string; fileName: string }> {
  const text = await convertFileToText(file);
  return {
    dataUrl: textToDataUrl(text),
    mimeType: 'text/plain',
    fileName: file.name.replace(/\.[^.]+$/, '.txt'),
  };
}
