import { downloadFile } from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';

type RecordField = { type: string; value: unknown };

type KintoneFileValue = {
  fileKey: string;
  name: string;
  contentType?: string;
};

export type OpenAIInputAttachment =
  | { type: 'image'; dataUrl: string; fileName: string }
  | { type: 'pdf'; dataUrl: string; fileName: string }
  | { type: 'text'; content: string; fileName: string };

/** テキストとして読み取れる拡張子 (SVG含む) */
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
  '.html',
  '.svg',
]);

/** ラスタ画像の拡張子 */
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']);

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function inferMimeType(file: KintoneFileValue, blob: Blob): string {
  if (blob.type) {
    return blob.type;
  }
  if (file.contentType) {
    return file.contentType;
  }
  return 'application/octet-stream';
}

type FileCategory = 'image' | 'pdf' | 'text' | 'unsupported';

function categorizeFile(fileName: string, mimeType: string): FileCategory {
  const ext = getExtension(fileName);

  // SVG はテキストベースなのでプロンプトに埋め込む
  if (ext === '.svg' || mimeType === 'image/svg+xml') {
    return 'text';
  }

  // ラスタ画像 → image_url として送信
  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(ext)) {
    return 'image';
  }

  // PDF → Chat Completions で唯一 type:"file" が使えるフォーマット
  if (ext === '.pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }

  // テキスト系ファイル → 内容を読み取ってプロンプトに埋め込む
  if (TEXT_EXTENSIONS.has(ext) || mimeType.startsWith('text/')) {
    return 'text';
  }

  return 'unsupported';
}

// ---------- テキストファイルのエンコーディング検出 (ai-chat と同様) ----------

function isValidUtf8(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i]!;
    if (b <= 0x7f) {
      i++;
    } else if ((b & 0xe0) === 0xc0) {
      if (i + 1 >= bytes.length || (bytes[i + 1]! & 0xc0) !== 0x80) return false;
      i += 2;
    } else if ((b & 0xf0) === 0xe0) {
      if (
        i + 2 >= bytes.length ||
        (bytes[i + 1]! & 0xc0) !== 0x80 ||
        (bytes[i + 2]! & 0xc0) !== 0x80
      )
        return false;
      i += 3;
    } else if ((b & 0xf8) === 0xf0) {
      if (
        i + 3 >= bytes.length ||
        (bytes[i + 1]! & 0xc0) !== 0x80 ||
        (bytes[i + 2]! & 0xc0) !== 0x80 ||
        (bytes[i + 3]! & 0xc0) !== 0x80
      )
        return false;
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}

function detectEncoding(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // BOM 判定
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le';
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be';
  }

  if (isValidUtf8(bytes)) {
    return 'utf-8';
  }

  // 日本語環境のフォールバック
  return 'shift-jis';
}

const MAX_TEXT_LENGTH = 100_000;

async function readBlobAsText(blob: Blob, fileName: string): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const encoding = detectEncoding(buffer);
  const decoder = new TextDecoder(encoding);
  let text = decoder.decode(buffer);

  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH) + '\n\n...（テキストが長すぎるため省略されました）';
  }

  return `📁 ${fileName}\n\`\`\`\n${text}\n\`\`\``;
}

function extractReferencedFileFieldCodes(
  template: string,
  record: Record<string, RecordField>
): string[] {
  const fieldCodes = new Set<string>();

  if (template.includes('{{record}}')) {
    for (const [fieldCode, field] of Object.entries(record)) {
      if (field.type === 'FILE') {
        fieldCodes.add(fieldCode);
      }
    }
  }

  const fieldPattern = /\{\{field:(.+?)\}\}/g;
  let match = fieldPattern.exec(template);
  while (match) {
    const fieldCode = match[1]?.trim();
    if (fieldCode && record[fieldCode]?.type === 'FILE') {
      fieldCodes.add(fieldCode);
    }
    match = fieldPattern.exec(template);
  }

  return [...fieldCodes];
}

function getKintoneFiles(field: RecordField | undefined): KintoneFileValue[] {
  if (!field || field.type !== 'FILE' || !Array.isArray(field.value)) {
    return [];
  }

  return field.value.filter((item): item is KintoneFileValue => {
    return (
      typeof item === 'object' &&
      item !== null &&
      'fileKey' in item &&
      typeof item.fileKey === 'string' &&
      'name' in item &&
      typeof item.name === 'string'
    );
  });
}

function convertBlobToDataUrl(blob: Blob): Promise<string> {
  const reader = new FileReader();
  reader.readAsDataURL(blob);

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('添付ファイルの変換に失敗しました'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('添付ファイルの変換に失敗しました'));
    };
  });
}

export async function collectReferencedAttachments(
  template: string,
  record: Record<string, RecordField>
): Promise<OpenAIInputAttachment[]> {
  const fieldCodes = extractReferencedFileFieldCodes(template, record);
  if (fieldCodes.length === 0) {
    return [];
  }

  const attachments: OpenAIInputAttachment[] = [];

  for (const fieldCode of fieldCodes) {
    const files = getKintoneFiles(record[fieldCode]);
    for (const file of files) {
      const blob = await downloadFile({
        fileKey: file.fileKey,
        guestSpaceId: GUEST_SPACE_ID,
        debug: isDev,
      });

      const mimeType = inferMimeType(file, blob);
      const category = categorizeFile(file.name, mimeType);

      if (category === 'unsupported') {
        if (isDev) {
          console.warn('[ai-output] unsupported file skipped', {
            fieldCode,
            fileName: file.name,
            mimeType,
          });
        }
        continue;
      }

      switch (category) {
        case 'image': {
          const typedBlob = mimeType === blob.type ? blob : blob.slice(0, blob.size, mimeType);
          const dataUrl = await convertBlobToDataUrl(typedBlob);
          attachments.push({ type: 'image', dataUrl, fileName: file.name });
          break;
        }
        case 'pdf': {
          const typedBlob =
            mimeType === blob.type ? blob : blob.slice(0, blob.size, 'application/pdf');
          const dataUrl = await convertBlobToDataUrl(typedBlob);
          attachments.push({ type: 'pdf', dataUrl, fileName: file.name });
          break;
        }
        case 'text': {
          const content = await readBlobAsText(blob, file.name);
          attachments.push({ type: 'text', content, fileName: file.name });
          break;
        }
      }
    }
  }

  return attachments;
}
