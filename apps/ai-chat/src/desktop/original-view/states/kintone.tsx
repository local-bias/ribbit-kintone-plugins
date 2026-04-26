import {
  downloadFile,
  getAllRecords,
  getSpace,
  updateRecord,
  upsertRecord,
  withSpaceIdFallback,
} from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { pluginCommonConfigAtom } from '@/desktop/public-state';
import { remapHistoryFileKeys, uploadHistoryAttachments } from '@/lib/file-utils';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { addChatLog } from '../action';
import { selectedHistoryAtom } from './states';

type UpdateAppParams = {
  appId: string;
  keyFieldCode: string;
  contentFieldCode: string;
  fileFieldCode?: string;
  guestSpaceId: string | null;
};

const kintoneSpaceAtom = atomFamily((spaceId: string) =>
  atom(async () => {
    const space = await withSpaceIdFallback({
      spaceId,
      func: getSpace,
      funcParams: {
        id: spaceId,
        debug: isDev,
      },
    });
    return space;
  })
);

export const outputAppGuestSpaceIdAtom = atom(async (get) => {
  if (GUEST_SPACE_ID) {
    return GUEST_SPACE_ID;
  }
  const common = get(pluginCommonConfigAtom);
  const { outputAppId: appId, outputAppSpaceId } = common;
  if (!appId || !outputAppSpaceId) {
    return null;
  }
  try {
    const space = await get(kintoneSpaceAtom(outputAppSpaceId));
    return space.isGuest ? outputAppSpaceId : null;
  } catch (error) {
    process.env.NODE_ENV === 'development' && console.error(error);
    return null;
  }
});

export const logAppGuestSpaceIdAtom = atom(async (get) => {
  if (GUEST_SPACE_ID) {
    return GUEST_SPACE_ID;
  }
  const common = get(pluginCommonConfigAtom);
  const { logAppId: appId, logAppSpaceId } = common;
  if (!appId || !logAppSpaceId) {
    return null;
  }

  try {
    const space = await get(kintoneSpaceAtom(logAppSpaceId));
    return space.isGuest ? logAppSpaceId : null;
  } catch (error) {
    process.env.NODE_ENV === 'development' && console.error(error);
    return null;
  }
});

const handleUpdateAppAtom = atom(null, async (get, set, params: UpdateAppParams) => {
  const { appId, keyFieldCode, contentFieldCode, fileFieldCode, guestSpaceId } = params;
  const selectedHistory = get(selectedHistoryAtom);
  if (!selectedHistory) {
    throw new Error('チャットが選択されていません');
  }

  let historyToSave = selectedHistory;
  let allFileKeys: string[] = [];
  let fileKeyToUploadName = new Map<string, string>();

  if (fileFieldCode) {
    // ファイルフィールドが設定されている場合: file-base64 をアップロードして永続化用の履歴を作成
    const result = await uploadHistoryAttachments(selectedHistory, guestSpaceId);
    historyToSave = result.history;
    allFileKeys = result.fileKeys;
    fileKeyToUploadName = result.fileKeyToUploadName;
  }

  // 最新の履歴状態を取得しマージ（AI応答で新しいメッセージが追加されている可能性があるため）
  const currentHistory = get(selectedHistoryAtom);
  if (currentHistory && currentHistory.messages.length > historyToSave.messages.length) {
    // 永続化対象以降の新しいメッセージを含める
    const additionalMessages = currentHistory.messages.slice(historyToSave.messages.length);
    historyToSave = {
      ...historyToSave,
      messages: [...historyToSave.messages, ...additionalMessages],
    };
  }

  const record: Record<string, { value: unknown }> = {
    [keyFieldCode]: { value: historyToSave.id },
    [contentFieldCode]: { value: JSON.stringify(historyToSave) },
  };

  if (fileFieldCode && allFileKeys.length > 0) {
    record[fileFieldCode] = {
      value: allFileKeys.map((fk) => ({ fileKey: fk })),
    };
  }

  await upsertRecord({
    app: appId,
    updateKey: { field: keyFieldCode, value: historyToSave.id },
    record,
    guestSpaceId: guestSpaceId ?? undefined,
    debug: isDev,
  });

  // 新規アップロードがある場合、永続fileKeyを取得してcontent JSONを修正
  if (fileFieldCode && fileKeyToUploadName.size > 0) {
    try {
      const records = await getAllRecords({
        app: appId,
        query: `${keyFieldCode} = "${historyToSave.id}"`,
        fields: [keyFieldCode, fileFieldCode],
        guestSpaceId: guestSpaceId ?? undefined,
        debug: isDev,
      });

      const savedRecord = records[0];
      if (savedRecord?.[fileFieldCode]) {
        const fileFieldValue = savedRecord[fileFieldCode].value;
        if (Array.isArray(fileFieldValue)) {
          // uploadName → permanentFileKey マッピングを構築
          const tempToPermanentMap = new Map<string, string>();
          for (const [tempKey, uploadName] of fileKeyToUploadName) {
            const permanentFile = (fileFieldValue as Array<{ fileKey: string; name: string }>).find(
              (f) => f.name === uploadName
            );
            if (permanentFile) {
              tempToPermanentMap.set(tempKey, permanentFile.fileKey);
            }
          }

          if (tempToPermanentMap.size > 0) {
            // 永続fileKeyで content JSON を修正
            const correctedHistory = remapHistoryFileKeys(historyToSave, tempToPermanentMap);

            await updateRecord({
              app: appId,
              updateKey: { field: keyFieldCode, value: historyToSave.id },
              record: {
                [contentFieldCode]: { value: JSON.stringify(correctedHistory) },
              },
              guestSpaceId: guestSpaceId ?? undefined,
              debug: isDev,
            });

            // in-memory state を更新（file-base64 → file with permanent keys）
            const latestHistory = get(selectedHistoryAtom);
            if (latestHistory) {
              const updatedMessages = latestHistory.messages.map((msg) => {
                const correctedMsg = correctedHistory.messages.find((m) => m.id === msg.id);
                if (correctedMsg?.attachments) {
                  return { ...msg, attachments: correctedMsg.attachments };
                }
                return msg;
              });
              set(selectedHistoryAtom, { ...latestHistory, messages: updatedMessages });
            }
          }
        }
      }
    } catch (error) {
      isDev && console.error('永続fileKeyの取得・修正に失敗しました', error);
    }
  }
});

export const handleUpdateOutputAppAtom = atom(null, async (get, set) => {
  const common = get(pluginCommonConfigAtom);

  const {
    outputAppId: appId,
    outputContentFieldCode: contentFieldCode,
    outputKeyFieldCode: keyFieldCode,
    outputFileFieldCode: fileFieldCode,
  } = common;

  if (!appId || !contentFieldCode || !keyFieldCode) {
    process.env.NODE_ENV === 'development' && console.warn('Content app is not configured');
    return;
  }

  const guestSpaceId = await get(outputAppGuestSpaceIdAtom);
  await set(handleUpdateAppAtom, {
    appId,
    keyFieldCode,
    contentFieldCode,
    fileFieldCode: fileFieldCode || undefined,
    guestSpaceId,
  });
});

export const handleUpdateLogAppAtom = atom(null, async (get) => {
  const common = get(pluginCommonConfigAtom);
  const selectedHistory = get(selectedHistoryAtom);

  if (!selectedHistory) {
    process.env.NODE_ENV === 'development' && console.warn('No chat history selected');
    return;
  }

  const {
    logAppId,
    logAppSessionIdFieldCode,
    logAppAssistantIdFieldCode,
    logAppRoleFieldCode,
    logAppContentFieldCode,
    logAppFileFieldCode,
  } = common;

  // 最新メッセージを取得
  const latestMessage = selectedHistory.messages[selectedHistory.messages.length - 1];
  if (!latestMessage) {
    return;
  }

  const content =
    typeof latestMessage.content === 'string'
      ? latestMessage.content
      : JSON.stringify(latestMessage.content);

  const guestSpaceId = await get(logAppGuestSpaceIdAtom);
  await addChatLog({
    appId: logAppId,
    sessionId: selectedHistory.id,
    assistantId: selectedHistory.assistantId,
    role: latestMessage.role,
    content,
    attachments: latestMessage.attachments,
    sessionIdFieldCode: logAppSessionIdFieldCode,
    assistantIdFieldCode: logAppAssistantIdFieldCode,
    roleFieldCode: logAppRoleFieldCode,
    contentFieldCode: logAppContentFieldCode,
    fileFieldCode: logAppFileFieldCode,
    guestSpaceId,
  });
});

export const fileAtom = atomFamily((fileKey: string) =>
  atom(async () => {
    const file = await downloadFile({ fileKey, guestSpaceId: GUEST_SPACE_ID, debug: isDev });
    return file;
  })
);

export const dataUrlAtom = atomFamily((fileKey: string) =>
  atom(async (get) => {
    const file = await get(fileAtom(fileKey));
    if (!file) {
      return null;
    }
    const arrayBuffer = await file.arrayBuffer();
    const base64String = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const dataUrl = `data:${file.type};base64,${base64String}`;
    return dataUrl;
  })
);
