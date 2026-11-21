import { GUEST_SPACE_ID } from '@/lib/global';
import { getAppId, getRecord } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { getCalendarEventFromKintoneRecord } from '../actions';
import { calendarEventsAtom } from './calendar';
import { appPropertiesAtom, pluginConditionAtom } from './kintone';

/**
 * 表示用タイトルや並び順のように、kintone側で計算される値を使用している場合は、
 * 保存後のレコードを再取得してカレンダーの表示に反映します
 *
 * 保存自体は完了しているため、再取得に失敗しても操作は失敗扱いにせず、表示中の予定もそのまま残す
 * (一時的な通信エラーで、保存済みの予定が一覧から消えてしまわないように)
 */
export const refreshComputedValuesAtom = atom(null, async (get, set, recordId: string) => {
  const condition = get(pluginConditionAtom);
  if (!condition) {
    return;
  }
  const { displayTitleField, sortField } = condition.calendarEvent;
  if (!displayTitleField && !sortField) {
    return;
  }

  try {
    const properties = await get(appPropertiesAtom);
    const record = await getRecord({
      app: getAppId()!,
      id: recordId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });
    const refreshed = await getCalendarEventFromKintoneRecord({ condition, properties, record });
    set(calendarEventsAtom, (current) =>
      current.map((event) => (event.id === recordId ? refreshed : event))
    );
  } catch (error) {
    console.error('保存したレコードの再取得に失敗しました', error);
  }
});
