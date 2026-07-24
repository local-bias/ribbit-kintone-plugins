import {
  getCalendarEventFromKintoneRecord,
  getKintoneRecordFromCalendarEvent,
  patchMasterException,
} from '@/desktop/actions';
import type { InlineInitialValue } from '@/desktop/inline-record';
import { INLINE_MESSAGE } from '@/desktop/inline-record';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { getAppId, getRecord } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { calendarEventsAtom, PluginCalendarEvent } from './calendar';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from './kintone';

export type DetailedDialogState =
  | {
      mode: 'create';
      initialValues: InlineInitialValue[];
      /** 「この回のみ編集」で分離オカレンスを作成する場合に設定する */
      override?: { masterId: string; originalStart: string };
    }
  | { mode: 'edit'; recordId: string }
  | null;

export const detailedDialogAtom = atom<DetailedDialogState>(null);

export const isDetailedModeAtom = atom((get) => get(pluginConditionAtom)?.editMode === 'detailed');

/** `handleDetailedDialogClosedAtom`の多重実行を防ぐためのガード。編集の保存成功後、kintoneが
 *  詳細画面へ遷移して`app.record.detail.show`も追加で発火し、キャンセル用メッセージが
 *  二重に届くことがあるため。 */
const isClosingDetailedDialogAtom = atom(false);

/**
 * 新規追加(空き日付クリック・FAB・この回のみ編集)のドラフトイベントから、詳細編集ダイアログ
 * (iframe)に渡す初期値を組み立てて開きます。`getKintoneRecordFromCalendarEvent`がkintone形式に
 * 変換した値をそのままURLの初期値パラメータとして使用します。
 */
export const openDetailedCreateDialogAtom = atom(
  null,
  async (
    get,
    set,
    params: { event: PluginCalendarEvent; override?: { masterId: string; originalStart: string } }
  ) => {
    const condition = get(pluginConditionAtom);
    if (!condition) return;
    const properties = await get(appPropertiesAtom);

    const record = await getKintoneRecordFromCalendarEvent({
      calendarEvent: params.event,
      condition,
      properties,
    });
    const { startField, endField } = condition.calendarEvent;

    const initialValues: InlineInitialValue[] = Object.entries(record)
      .filter(([, field]) => field !== undefined)
      .map(([fieldCode, field]) => ({ fieldCode, value: field!.value }))
      .filter(({ fieldCode, value }) => {
        // start/endは常に保持する(空でも問題にならないため、フィルタ対象から除外)
        if (fieldCode === startField || fieldCode === endField) return true;
        if (typeof value === 'string') return value !== '';
        if (Array.isArray(value)) return value.length > 0;
        return value != null;
      });

    set(detailedDialogAtom, { mode: 'create', initialValues, override: params.override });
  }
);

/** 保存済みレコードを1件再取得し、カレンダーイベント一覧に反映する(新規反映・更新反映の両方) */
const reflectSavedRecordAtom = atom(null, async (get, set, recordId: string) => {
  const condition = get(pluginConditionAtom)!;
  const properties = await get(appPropertiesAtom);

  try {
    const record = await getRecord({
      app: getAppId()!,
      id: recordId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });
    const updated = await getCalendarEventFromKintoneRecord({ condition, properties, record });
    set(calendarEventsAtom, (current) =>
      produce(current, (draft) => {
        const index = draft.findIndex((event) => event.id === recordId);
        if (index !== -1) {
          draft[index] = updated;
        } else {
          draft.push(updated);
        }
      })
    );
  } catch (error) {
    // レコードが見つからない(削除済み等)場合は一覧から除去する
    set(calendarEventsAtom, (current) => current.filter((event) => event.id !== recordId));
    throw error;
  }
});

/**
 * 詳細編集ダイアログ(iframe)がpostMessage、または手動操作(×ボタン等)で閉じられた際の後始末。
 *
 * - 新規作成: `createSubmitSuccess`メッセージ(recordId付き)のときのみレコードを反映する。
 *   それ以外(キャンセル・手動クローズ)は何もkintoneに保存されていないため反映不要。
 * - 編集: 成功・キャンセル・手動クローズのいずれでも対象レコードを防御的に再取得する
 *   (保存直後にメッセージを取りこぼした場合でも取りこぼしなく反映するため)。
 */
export const handleDetailedDialogClosedAtom = atom(
  null,
  async (get, set, payload?: { type?: string; recordId?: string }) => {
    const state = get(detailedDialogAtom);
    if (!state || get(isClosingDetailedDialogAtom)) return;

    set(isClosingDetailedDialogAtom, true);
    set(loadingAtom, true);
    try {
      if (state.mode === 'create') {
        if (payload?.type !== INLINE_MESSAGE.createSubmitSuccess || !payload.recordId) {
          return;
        }

        await set(reflectSavedRecordAtom, payload.recordId);

        if (state.override) {
          const condition = get(pluginConditionAtom)!;
          const properties = await get(appPropertiesAtom);
          const updatedMaster = await patchMasterException({
            calendarEvents: get(calendarEventsAtom),
            masterId: state.override.masterId,
            occurrenceStart: state.override.originalStart,
            condition,
            properties,
          });
          set(calendarEventsAtom, (current) =>
            produce(current, (draft) => {
              const index = draft.findIndex((event) => event.id === updatedMaster.id);
              if (index !== -1) draft[index] = updatedMaster;
            })
          );
        }
      } else {
        await set(reflectSavedRecordAtom, state.recordId);
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('desktop.error.detailedRefreshFailed'), { variant: 'error' });
    } finally {
      set(loadingAtom, false);
      set(isClosingDetailedDialogAtom, false);
      // 処理中に(理論上は)別のセッションが開かれていた場合、無関係に閉じてしまわないようにする
      if (get(detailedDialogAtom) === state) {
        set(detailedDialogAtom, null);
      }
    }
  }
);
