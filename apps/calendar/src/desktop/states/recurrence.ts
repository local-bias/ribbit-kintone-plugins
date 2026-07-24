import { buildOverrideDraftEvent, patchMasterException } from '@/desktop/actions';
import { extractErrorMessage } from '@/lib/error';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { deleteAllRecords, getAppId } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { calendarEventsAtom, PluginCalendarEvent } from './calendar';
import {
  detailedDialogAtom,
  isDetailedModeAtom,
  openDetailedCreateDialogAtom,
} from './detailed-dialog';
import { dialogPropsAtom, dialogShownAtom } from './dialog';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from './kintone';

export type OccurrenceContext = {
  master: PluginCalendarEvent;
  /** The clicked occurrence's own start/end (`EventApi.startStr`/`endStr`), not the master's. */
  occurrenceStart: string;
  occurrenceEnd: string;
};

export const occurrenceScopeDialogShownAtom = atom(false);
export const occurrenceContextAtom = atom<OccurrenceContext | null>(null);

export const openOccurrenceScopeDialogAtom = atom(null, (_, set, context: OccurrenceContext) => {
  set(occurrenceContextAtom, context);
  set(occurrenceScopeDialogShownAtom, true);
});

export const handleOccurrenceScopeCloseAtom = atom(null, (_, set) => {
  set(occurrenceScopeDialogShownAtom, false);
  set(occurrenceContextAtom, null);
});

/** この回のみ編集: 何も保存せず、既存レコードの下書き(new:true)を開く。キャンセル時は
 *  下書きが破棄されるだけでkintoneに何も書き込まれない。
 *  詳細編集モードでは下書きをcalendarEventsAtomにpushせず、kintone標準画面のiframeダイアログを
 *  「分離オカレンス作成」として開く(保存成功時にmasterの除外リストへ追記する)。 */
export const handleEditSingleOccurrenceAtom = atom(null, async (get, set) => {
  const context = get(occurrenceContextAtom);
  if (!context) return;

  const draft = buildOverrideDraftEvent({
    master: context.master,
    occurrenceStart: context.occurrenceStart,
    occurrenceEnd: context.occurrenceEnd,
  });

  if (get(isDetailedModeAtom) && context.master.id) {
    await set(openDetailedCreateDialogAtom, {
      event: draft,
      override: { masterId: context.master.id, originalStart: context.occurrenceStart },
    });
    set(occurrenceScopeDialogShownAtom, false);
    set(occurrenceContextAtom, null);
    return;
  }

  set(calendarEventsAtom, (current) => [...current, draft]);
  set(dialogPropsAtom, { new: true, event: draft });
  set(dialogShownAtom, true);
  set(occurrenceScopeDialogShownAtom, false);
  set(occurrenceContextAtom, null);
});

/** シリーズ全体編集: マスターレコードをそのまま既存の編集ダイアログで開く。
 *  詳細編集モードではkintone標準画面のiframeダイアログをマスターの編集として開く。 */
export const handleEditSeriesAtom = atom(null, (get, set) => {
  const context = get(occurrenceContextAtom);
  if (!context) return;

  if (get(isDetailedModeAtom) && context.master.id) {
    set(detailedDialogAtom, { mode: 'edit', recordId: context.master.id });
    set(occurrenceScopeDialogShownAtom, false);
    set(occurrenceContextAtom, null);
    return;
  }

  set(dialogPropsAtom, { new: false, event: context.master });
  set(dialogShownAtom, true);
  set(occurrenceScopeDialogShownAtom, false);
  set(occurrenceContextAtom, null);
});

/** この回のみ削除: 既存の分離レコードがあればそれを削除、なければマスターの除外リストに追記。 */
export const handleDeleteSingleOccurrenceAtom = atom(null, async (get, set) => {
  const context = get(occurrenceContextAtom);
  if (!context?.master.id) return;

  set(loadingAtom, true);
  try {
    const calendarEvents = get(calendarEventsAtom);
    const existingOverride = calendarEvents.find(
      (event) =>
        event.extendedProps?.recurrence?.kind === 'override' &&
        event.extendedProps.recurrence.masterId === context.master.id &&
        event.extendedProps.recurrence.originalStart === context.occurrenceStart
    );

    if (existingOverride?.id) {
      await deleteAllRecords({
        app: getAppId()!,
        ids: [Number(existingOverride.id)],
        guestSpaceId: GUEST_SPACE_ID,
        debug: process.env.NODE_ENV === 'development',
      });
      set(calendarEventsAtom, (current) =>
        current.filter((event) => event.id !== existingOverride.id)
      );
    } else {
      const properties = await get(appPropertiesAtom);
      const condition = get(pluginConditionAtom);
      const updatedMaster = await patchMasterException({
        calendarEvents,
        masterId: context.master.id,
        occurrenceStart: context.occurrenceStart,
        condition: condition!,
        properties,
      });
      set(calendarEventsAtom, (current) =>
        produce(current, (draft) => {
          const index = draft.findIndex((event) => event.id === updatedMaster.id);
          if (index !== -1) draft[index] = updatedMaster;
        })
      );
    }

    enqueueSnackbar(t('desktop.toast.recordDeleted'), { variant: 'success' });
  } catch (error) {
    console.error(error);
    enqueueSnackbar(t('desktop.error.recordDeleteFailed', extractErrorMessage(error)), {
      variant: 'error',
    });
  } finally {
    set(loadingAtom, false);
    set(occurrenceScopeDialogShownAtom, false);
    set(occurrenceContextAtom, null);
  }
});

/** シリーズ全体削除: マスターと、既に分離済みの関連レコードをまとめて削除する。
 *  クエリ条件で除外され現在ロードされていない分離レコードまでは追跡しない(v1の既知の制限)。 */
export const handleDeleteSeriesAtom = atom(null, async (get, set) => {
  const context = get(occurrenceContextAtom);
  if (!context?.master.id) return;

  set(loadingAtom, true);
  try {
    const masterId = context.master.id;
    const calendarEvents = get(calendarEventsAtom);
    const orphanIds = calendarEvents
      .filter(
        (event) =>
          event.extendedProps?.recurrence?.kind === 'override' &&
          event.extendedProps.recurrence.masterId === masterId &&
          event.id
      )
      .map((event) => event.id!);
    const idsToDelete = [masterId, ...orphanIds];

    await deleteAllRecords({
      app: getAppId()!,
      ids: idsToDelete.map(Number),
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });

    set(calendarEventsAtom, (current) => current.filter((event) => !idsToDelete.includes(event.id!)));
    enqueueSnackbar(t('desktop.toast.recordDeleted'), { variant: 'success' });
  } catch (error) {
    console.error(error);
    enqueueSnackbar(t('desktop.error.recordDeleteFailed', extractErrorMessage(error)), {
      variant: 'error',
    });
  } finally {
    set(loadingAtom, false);
    set(occurrenceScopeDialogShownAtom, false);
    set(occurrenceContextAtom, null);
  }
});
