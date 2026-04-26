import { produce } from 'immer';
import { atom } from 'jotai';
import { nanoid } from 'nanoid';
import { convertFileToAttachment, isConvertibleFile } from '@/lib/file-converter';
import { getBase64EncodedFile } from '@/lib/image';
import type { ChatMessage, ChatMessageV2, MessageAttachment } from '@/lib/static';
import { createNewChatHistory, getChatTitle } from '../action';
import {
  inputFilesAtom,
  inputTextAtom,
  selectedHistoryAtom,
  selectedHistoryIdAtom,
  selectedPluginConditionAtom,
} from './states';

const handlePushMessageAtom = atom(null, async (get, set, message: ChatMessage) => {
  const selectedHistory = get(selectedHistoryAtom);
  const selectedCondition = get(selectedPluginConditionAtom);

  const historyId = selectedHistory?.id ?? nanoid();
  const history =
    selectedHistory ??
    createNewChatHistory({
      id: historyId,
      assistantId: selectedCondition.id,
      title: getChatTitle(message),
      messages: [],
    });

  const updatedHistory = produce(history, (draft) => {
    draft.messages.push(message);
  });

  set(selectedHistoryIdAtom, historyId);
  set(selectedHistoryAtom, updatedHistory);
});

export const handlePushUserMessageAtom = atom(null, async (get, set) => {
  const content = get(inputTextAtom);
  const files = get(inputFilesAtom);
  if (files && files.length > 0) {
    const attachments: MessageAttachment[] = [];

    for (const file of files) {
      if (isConvertibleFile(file)) {
        // Excel / テキストファイル: テキストに変換して file-base64 添付
        const converted = await convertFileToAttachment(file);
        attachments.push({
          type: 'file-base64',
          dataUrl: converted.dataUrl,
          mimeType: converted.mimeType,
          fileName: converted.fileName,
        });
      } else {
        // 画像 / PDF: 従来通り base64 添付
        const dataUrl = await getBase64EncodedFile(file);
        attachments.push({
          type: 'file-base64',
          dataUrl,
          mimeType: file.type || 'application/octet-stream',
          fileName: file.name || 'uploaded_file',
        });
      }
    }

    await set(handlePushMessageAtom, {
      id: nanoid(),
      role: 'user',
      content,
      ...(attachments.length > 0 ? { attachments } : {}),
    });
  } else {
    await set(handlePushMessageAtom, {
      id: nanoid(),
      role: 'user',
      content: content.replace(/\n/g, '  \n'),
    });
  }
  set(inputTextAtom, '');
  set(inputFilesAtom, []);
});

export const handlePushAssistantMessageAtom = atom(
  null,
  async (
    _,
    set,
    payload: { content: string; id?: string; attachments?: ChatMessageV2['attachments'] }
  ) => {
    await set(handlePushMessageAtom, {
      id: payload.id ?? nanoid(),
      role: 'assistant',
      content: payload.content,
      ...(payload.attachments ? { attachments: payload.attachments } : {}),
    });
  }
);

/**
 * チャット履歴のHTMLプロパティを更新する
 */
export const handleUpdateHtmlAtom = atom(null, (get, set, html: string | undefined) => {
  const selectedHistory = get(selectedHistoryAtom);
  if (!selectedHistory) {
    return;
  }
  const updatedHistory = produce(selectedHistory, (draft) => {
    draft.html = html;
  });
  set(selectedHistoryAtom, updatedHistory);
});
