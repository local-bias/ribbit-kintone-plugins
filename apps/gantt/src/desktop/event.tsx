import { manager } from '@/lib/event-manager';
import { restorePluginConfig, VIEW_ROOT_ID } from '@/lib/plugin';
import { getAllRecords, getQueryCondition } from '@konomi-app/kintone-utilities';
import { store } from '@repo/jotai';
import { createRoot, Root } from 'react-dom/client';
import GanttApp from './app';
import {
  currentConditionAtom,
  ganttAppIdAtom,
  ganttLoadingAtom,
  ganttRecordsAtom,
  ganttScaleAtom,
} from './public-state';
import { GUEST_SPACE_ID } from '@/lib/global';

let cachedRoot: Root | null = null;

manager.add(['app.record.index.show'], async (event) => {
  const config = restorePluginConfig();

  const targetCondition = config.conditions.find(
    (condition) => Number(condition.viewId) === event.viewId
  );

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
      targetCondition.categoryFieldCode,
      targetCondition.progressFieldCode,
      targetCondition.colorFieldCode,
      targetCondition.categorySortFieldCode,
    ].filter(Boolean);

    const query = getQueryCondition() ?? undefined;

    const records = await getAllRecords({
      app: event.appId,
      query,
      fields: ['$id', ...fields],
      guestSpaceId: GUEST_SPACE_ID,
      debug: false,
    });

    store.set(ganttRecordsAtom, records);
  } catch (error) {
    console.error('[gantt] Failed to fetch records:', error);
  } finally {
    store.set(ganttLoadingAtom, false);
  }

  return event;
});
