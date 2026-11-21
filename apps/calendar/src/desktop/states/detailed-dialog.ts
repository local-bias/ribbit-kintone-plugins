import {
  getCalendarEventFromKintoneRecord,
  getKintoneRecordFromCalendarEvent,
  patchMasterException,
} from '@/desktop/actions';
import {
  INLINE_MESSAGE,
  buildInlineCreateUrl,
  buildInlineEditUrl,
  buildMobileInlineCreateUrl,
  buildMobileInlineEditUrl,
  canBuildMobilePageUrl,
  shouldUseDetailedEditMode,
  type InlineInitialValue,
} from '@/desktop/inline-record';
import { isShownUnderFilters } from '@/desktop/event-filters';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { getAppId, getRecord, isMobile } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { calendarEventsAtom, calendarFiltersAtom, type PluginCalendarEvent } from './calendar';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from './kintone';
import { notifyIfHiddenByFiltersAtom } from './filter-notice';
import { refreshComputedValuesAtom } from './refresh';

export type DetailedDialogState =
  | {
      mode: 'create';
      /** iframeに読み込むkintone標準のレコード追加画面のURL */
      url: string;
      /** 「この回のみ編集」で分離オカレンスを作成する場合に設定する */
      override?: { masterId: string; originalStart: string };
    }
  | {
      mode: 'edit';
      /** iframeに読み込むkintone標準のレコード編集画面のURL */
      url: string;
      recordId: string;
    }
  | null;

export const detailedDialogAtom = atom<DetailedDialogState>(null);

/** モバイルでは`kintone.buildPageUrl`が使える場合のみ詳細編集を使い、それ以外は簡易編集
 *  ダイアログにフォールバックする(`shouldUseDetailedEditMode`を参照) */
export const isDetailedModeAtom = atom((get) =>
  shouldUseDetailedEditMode({
    editMode: get(pluginConditionAtom)?.editMode,
    isMobile: isMobile(),
    canBuildMobilePageUrl: canBuildMobilePageUrl(),
  })
);

/** URLの組み立て中(=ダイアログを開いている途中)かどうか。連打による多重起動を防ぐ */
const isOpeningDetailedDialogAtom = atom(false);

const getRequiredAppId = (): string => {
  const appId = getAppId();
  if (appId === null || appId === undefined) {
    throw new Error('Failed to get the app id for the detailed edit dialog');
  }
  return String(appId);
};

/**
 * iframeに読み込むURLを組み立ててから詳細編集ダイアログを開きます。
 *
 * モバイル版のURLは`kintone.buildPageUrl`(サーバー問い合わせを伴う非同期API)で組み立てるため、
 * 組み立て中は待機表示を出し、その間の再操作は無視する。組み立てに失敗した場合は
 * ダイアログを開かずにエラーを通知する。
 */
const showDetailedDialogAtom = atom(
  null,
  async (
    get,
    set,
    params: {
      buildUrl: () => string | Promise<string>;
      toState: (url: string) => NonNullable<DetailedDialogState>;
    }
  ) => {
    if (get(isOpeningDetailedDialogAtom) || get(detailedDialogAtom) !== null) return;

    set(isOpeningDetailedDialogAtom, true);
    set(loadingAtom, true);
    try {
      const url = await params.buildUrl();
      if (get(detailedDialogAtom) === null) {
        set(detailedDialogAtom, params.toState(url));
      }
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('desktop.error.detailedOpenFailed'), { variant: 'error' });
    } finally {
      set(loadingAtom, false);
      set(isOpeningDetailedDialogAtom, false);
    }
  }
);

/** 既存レコードを詳細編集ダイアログ(iframe)で開きます */
export const openDetailedEditDialogAtom = atom(null, (_get, set, recordId: string) =>
  set(showDetailedDialogAtom, {
    buildUrl: () =>
      isMobile()
        ? buildMobileInlineEditUrl({ appId: getRequiredAppId(), recordId })
        : buildInlineEditUrl(recordId),
    toState: (url) => ({ mode: 'edit', url, recordId }),
  })
);

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

    await set(showDetailedDialogAtom, {
      buildUrl: () =>
        isMobile()
          ? buildMobileInlineCreateUrl({ appId: getRequiredAppId(), condition, initialValues })
          : buildInlineCreateUrl({ condition, initialValues }),
      toState: (url) => ({ mode: 'create', url, override: params.override }),
    });
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
        set(notifyIfHiddenByFiltersAtom, payload.recordId);

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
          // 更新者などkintoneが決める値を担当者等に使っている場合に備え、更新したマスターを再取得する
          if (updatedMaster.id) {
            await set(refreshComputedValuesAtom, updatedMaster.id);
          }
        }
      } else {
        // 編集は取りこぼし対策としてキャンセル時も再取得するため、キャンセルした場合と、もともと
        // 絞り込みで非表示だった予定の場合は「保存しました」と通知しない
        const before = get(calendarEventsAtom).find(({ id }) => id === state.recordId);
        const wasShown = !before || isShownUnderFilters(before, get(calendarFiltersAtom));
        await set(reflectSavedRecordAtom, state.recordId);
        if (payload?.type !== INLINE_MESSAGE.editCancelled && wasShown) {
          set(notifyIfHiddenByFiltersAtom, state.recordId);
        }
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
