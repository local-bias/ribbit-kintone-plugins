import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID } from '@/lib/global';
import { getCategoryFieldCodes, VIEW_ROOT_ID } from '@/lib/plugin';
import {
  getAllRecordsWithId,
  getFormFields,
  getQueryCondition,
  kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { store } from '@repo/jotai';
import { createRoot, Root } from 'react-dom/client';
import GanttApp from './app';
import {
  currentConditionAtom,
  ganttAppIdAtom,
  ganttFormFieldsAtom,
  ganttLoadingAtom,
  ganttRecordsAtom,
  ganttScaleAtom,
  pluginConditionsAtom,
} from './public-state';

let cachedRoot: Root | null = null;

manager.add(['app.record.index.show'], async (event) => {
  const conditions = store.get(pluginConditionsAtom);

  const targetCondition = conditions.find((condition) => Number(condition.viewId) === event.viewId);

  if (!targetCondition) {
    return event;
  }

  store.set(currentConditionAtom, targetCondition);
  store.set(ganttScaleAtom, targetCondition.defaultScale);
  store.set(ganttLoadingAtom, true);
  store.set(ganttAppIdAtom, event.appId);

  const rootElement =
    document.querySelector(`#${VIEW_ROOT_ID}`) ||
    document.querySelector('.gaia-app-indexview-customview-html') ||
    document.querySelector('.gaia-mobile-app-customview') ||
    document.querySelector('.contents-gaia');

  if (!rootElement) {
    console.error('[gantt] Root element not found');
    return event;
  }

  const root = cachedRoot || createRoot(rootElement);
  if (!cachedRoot) {
    cachedRoot = root;
  }

  root.render(<GanttApp />);

  try {
    const fields = [
      targetCondition.titleFieldCode,
      targetCondition.startDateFieldCode,
      targetCondition.endDateFieldCode,
      targetCondition.assigneeFieldCode,
      ...getCategoryFieldCodes(targetCondition),
      targetCondition.progressFieldCode,
      targetCondition.categorySortFieldCode,
      ...targetCondition.tooltipFieldCodes,
    ].filter(Boolean);

    const condition = getQueryCondition() ?? undefined;

    const onStep: Parameters<typeof getAllRecordsWithId>[0]['onStep'] = ({ incremental }) => {
      store.set(ganttRecordsAtom, (prev) => [...prev, ...incremental]);
    };

    const [, { properties }] = await Promise.all([
      getAllRecordsWithId({
        app: event.appId,
        condition,
        fields: ['$id', ...fields],
        guestSpaceId: GUEST_SPACE_ID,
        onStep,
        debug: false,
      }),
      getFormFields({
        app: event.appId,
        guestSpaceId: GUEST_SPACE_ID,
        debug: false,
      }),
    ]);

    store.set(ganttFormFieldsAtom, Object.values(properties) as kintoneAPI.FieldProperty[]);
  } catch (error) {
    console.error('[gantt] Failed to fetch records:', error);
  } finally {
    store.set(ganttLoadingAtom, false);
  }

  return event;
});

/**
 * iframe 内でレコード編集が保存またはキャンセルされた場合に、親ウィンドウへ通知する。
 * edit-record-dialog が付与する `gantt_inline_edit=1` クエリパラメータの有無で判定。
 */
const INLINE_EDIT_PARAM = 'gantt_inline_edit';

if (new URLSearchParams(location.search).has(INLINE_EDIT_PARAM)) {
  manager.add(['app.record.edit.submit.success'], (event) => {
    window.parent.postMessage({ type: 'gantt-edit-submit-success' }, location.origin);
    return event;
  });

  // キャンセル時は詳細画面に遷移するため、detail.show で検知して閉じる
  manager.add(['app.record.detail.show'], (event) => {
    window.parent.postMessage({ type: 'gantt-edit-cancelled' }, location.origin);
    return event;
  });
}
