import { pluginCommonConfigAtom } from '@/desktop/public-state';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import {
  addRecord,
  getSpace,
  upsertRecord,
  withSpaceIdFallback,
} from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomFamily } from 'jotai-family';
import { selectedHistoryAtom } from './states';

type UpdateAppParams = {
  appId: string;
  keyFieldCode: string;
  contentFieldCode: string;
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

const handleUpdateAppAtom = atom(null, async (get, _, params: UpdateAppParams) => {
  const { appId, keyFieldCode, contentFieldCode, guestSpaceId } = params;
  const selectedHistory = get(selectedHistoryAtom);
  if (!selectedHistory) {
    throw new Error('チャットが選択されていません');
  }

  await upsertRecord({
    app: appId,
    updateKey: {
      field: keyFieldCode,
      value: selectedHistory.id,
    },
    record: {
      [keyFieldCode]: { value: selectedHistory.id },
      [contentFieldCode]: { value: JSON.stringify(selectedHistory) },
    },
    guestSpaceId: guestSpaceId ?? undefined,
    debug: process.env.NODE_ENV === 'development',
  });
});

export const handleUpdateOutputAppAtom = atom(null, async (get, set) => {
  const common = get(pluginCommonConfigAtom);

  const {
    outputAppId: appId,
    outputContentFieldCode: contentFieldCode,
    outputKeyFieldCode: keyFieldCode,
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
    guestSpaceId,
  });
});

const handleUpdateLogAppV1Atom = atom(null, async (get, set) => {
  const common = get(pluginCommonConfigAtom);

  const {
    logAppId: appId,
    logContentFieldCode: contentFieldCode,
    logKeyFieldCode: keyFieldCode,
  } = common;

  if (!appId || !contentFieldCode || !keyFieldCode) {
    process.env.NODE_ENV === 'development' && console.warn('Log app is not configured');
    return;
  }

  const guestSpaceId = await get(logAppGuestSpaceIdAtom);
  await set(handleUpdateAppAtom, {
    appId,
    keyFieldCode,
    contentFieldCode,
    guestSpaceId,
  });
});

const handleUpdateLogAppV2Atom = atom(null, async (get) => {
  const common = get(pluginCommonConfigAtom);
  const selectedHistory = get(selectedHistoryAtom);

  if (!selectedHistory) {
    process.env.NODE_ENV === 'development' && console.warn('No chat history selected');
    return;
  }

  const {
    logAppId,
    logAppV2SessionIdFieldCode,
    logAppV2AssistantIdFieldCode,
    logAppV2RoleFieldCode,
    logAppV2ContentFieldCode,
  } = common;

  if (
    !logAppId ||
    !logAppV2SessionIdFieldCode ||
    !logAppV2RoleFieldCode ||
    !logAppV2ContentFieldCode
  ) {
    process.env.NODE_ENV === 'development' && console.warn('Log app V2 is not properly configured');
    return;
  }

  // 最新メッセージを取得
  const latestMessage = selectedHistory.messages[selectedHistory.messages.length - 1];
  if (!latestMessage) {
    return;
  }

  const record: Record<string, { value: string }> = {
    [logAppV2SessionIdFieldCode]: { value: selectedHistory.id },
    [logAppV2RoleFieldCode]: { value: latestMessage.role },
    [logAppV2ContentFieldCode]: {
      value:
        typeof latestMessage.content === 'string'
          ? latestMessage.content
          : JSON.stringify(latestMessage.content),
    },
  };

  if (logAppV2AssistantIdFieldCode) {
    record[logAppV2AssistantIdFieldCode] = { value: selectedHistory.assistantId };
  }

  const guestSpaceId = await get(logAppGuestSpaceIdAtom);
  // 追加だけなので非同期で実行
  addRecord({
    app: logAppId,
    record,
    guestSpaceId: guestSpaceId ?? undefined,
    debug: process.env.NODE_ENV === 'development',
  });
});

export const handleUpdateLogAppAtom = atom(null, async (get, set) => {
  const common = get(pluginCommonConfigAtom);
  const { logAppVersion } = common;

  if (logAppVersion === 'v2') {
    await set(handleUpdateLogAppV2Atom);
  } else {
    await set(handleUpdateLogAppV1Atom);
  }
});
