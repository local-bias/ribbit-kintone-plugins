import { pluginCommonConfigAtom } from '@/desktop/public-state';
import { store } from '@/lib/store';
import { getAllRecords } from '@konomi-app/kintone-utilities';
import { migrateChatHistory } from '../action';
import { outputAppGuestSpaceIdAtom } from '../states/kintone';
import { chatHistoriesAtom, historiesFetchedAtom } from '../states/states';
import { isDev } from '@/lib/global';

export const initializeRecords = async () => {
  const commonConfig = store.get(pluginCommonConfigAtom);

  const { outputAppId, outputContentFieldCode } = commonConfig;
  if (!outputAppId || !outputContentFieldCode) {
    store.set(historiesFetchedAtom, true);
    return;
  }
  const guestSpaceId = await store.get(outputAppGuestSpaceIdAtom);
  const records = await getAllRecords({
    app: outputAppId,
    fields: ['$id', outputContentFieldCode],
    guestSpaceId: guestSpaceId ?? undefined,
    debug: process.env.NODE_ENV === 'development',
  });
  const histories = records
    .filter(
      (record) =>
        record[outputContentFieldCode] &&
        typeof record[outputContentFieldCode].value === 'string' &&
        record[outputContentFieldCode].value !== ''
    )
    .map((record) => {
      try {
        const history = migrateChatHistory(
          JSON.parse(record[outputContentFieldCode].value as string)
        );
        return history;
      } catch (error) {
        isDev && console.error('チャット履歴のマイグレーションに失敗しました', error);
        return null;
      }
    })
    .filter((history): history is NonNullable<typeof history> => history !== null);
  process.env.NODE_ENV === 'development' && console.log('⌛ histories', histories);
  store.set(chatHistoriesAtom, (_current) => [..._current, ...histories]);
  store.set(historiesFetchedAtom, true);
};
