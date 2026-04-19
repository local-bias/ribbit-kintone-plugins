import { uploadFile } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import { GUEST_SPACE_ID, isDev } from './global';
import type { ChatHistory, MessageAttachment } from './static';

/**
 * Base64 Data URL を Blob に変換する
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header?.match(/^data:(.*?);/)?.[1] ?? 'application/octet-stream';
  const binaryString = atob(base64Data ?? '');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export type UploadHistoryResult = {
  /** file-base64 → file (一時fileKey) に変換済みの永続化用履歴 */
  history: ChatHistory;
  /** 全ファイルキー（既存permanent + 新規temp） */
  fileKeys: string[];
  /** 新規アップロードの tempFileKey → uploadName マッピング */
  fileKeyToUploadName: Map<string, string>;
};

/**
 * ChatHistory 内の file-base64 アタッチメントを kintone にアップロードし、
 * file アタッチメントに変換する（永続化用）
 *
 * ※ アップロード時に一意なファイル名を生成し、レコード保存後の永続fileKey取得に備える
 */
export async function uploadHistoryAttachments(
  history: ChatHistory,
  guestSpaceId?: string | null
): Promise<UploadHistoryResult> {
  const allFileKeys: string[] = [];
  const fileKeyToUploadName = new Map<string, string>();

  const messages = await Promise.all(
    history.messages.map(async (message) => {
      if (!message.attachments?.length) {
        return message;
      }

      const hasBase64 = message.attachments.some((a) => a.type === 'file-base64');
      if (!hasBase64) {
        // 既存の file アタッチメントの fileKey を収集
        for (const a of message.attachments) {
          if (a.type === 'file') {
            allFileKeys.push(a.fileKey);
          }
        }
        return message;
      }

      const attachments = await Promise.all(
        message.attachments.map(async (a): Promise<MessageAttachment> => {
          if (a.type === 'file-base64') {
            // ユニークなアップロード名を生成（永続fileKeyマッピング用）
            const uploadName = `${nanoid()}_${a.fileName}`;
            const blob = dataUrlToBlob(a.dataUrl);
            const { fileKey } = await uploadFile({
              file: { name: uploadName, data: blob },
              guestSpaceId: guestSpaceId ?? GUEST_SPACE_ID,
              debug: isDev,
            });
            fileKeyToUploadName.set(fileKey, uploadName);
            allFileKeys.push(fileKey);
            return {
              type: 'file',
              fileKey,
              mimeType: a.mimeType,
              fileName: a.fileName,
            };
          }
          if (a.type === 'file') {
            allFileKeys.push(a.fileKey);
          }
          return a;
        })
      );

      return { ...message, attachments };
    })
  );

  return {
    history: { ...history, messages },
    fileKeys: allFileKeys,
    fileKeyToUploadName,
  };
}

/**
 * ChatHistory 内の一時fileKeyを永続fileKeyに置換する
 */
export function remapHistoryFileKeys(
  history: ChatHistory,
  tempToPermanentMap: Map<string, string>
): ChatHistory {
  if (tempToPermanentMap.size === 0) return history;

  const messages = history.messages.map((msg) => {
    if (!msg.attachments?.length) return msg;

    const newAttachments = msg.attachments.map((a) => {
      if (a.type === 'file' && tempToPermanentMap.has(a.fileKey)) {
        return { ...a, fileKey: tempToPermanentMap.get(a.fileKey)! };
      }
      return a;
    });

    return { ...msg, attachments: newAttachments };
  });

  return { ...history, messages };
}

/**
 * 単一メッセージ内の file-base64 アタッチメントをアップロードして fileKey を返す
 */
export async function uploadMessageBase64Attachments(
  attachments: MessageAttachment[],
  guestSpaceId?: string | null
): Promise<string[]> {
  if (!attachments.length) {
    return [];
  }

  const fileKeys = await Promise.all(
    attachments
      .filter((attachment): attachment is Extract<MessageAttachment, { type: 'file-base64' }> => {
        return attachment.type === 'file-base64';
      })
      .map(async (attachment) => {
        const uploadName = `${nanoid()}_${attachment.fileName}`;
        const blob = dataUrlToBlob(attachment.dataUrl);
        const { fileKey } = await uploadFile({
          file: { name: uploadName, data: blob },
          guestSpaceId: guestSpaceId ?? GUEST_SPACE_ID,
          debug: isDev,
        });
        return fileKey;
      })
  );

  return fileKeys;
}
