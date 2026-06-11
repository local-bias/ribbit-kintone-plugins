import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { store } from '@repo/jotai';
import { applyActions, isConditionMet, type LoginUser } from '@/lib/action';
import { manager } from '@/lib/event-manager';
import type { TargetEvent, TriggerTiming } from '@/schema/plugin-config';
import { validPluginConditionsAtom } from './public-state';

/** ログインユーザー情報を取得します */
const getLoginUser = (): LoginUser => {
  const user = kintone.getLoginUser();
  return { code: user.code, name: user.name };
};

/**
 * 指定された画面・タイミングで、条件を満たす設定のアクションをレコードへ適用します
 */
const processEvent = <T extends kintoneAPI.js.Event>(
  event: T,
  screen: TargetEvent,
  timing: TriggerTiming
): T => {
  const conditions = store.get(validPluginConditionsAtom);
  const loginUser = getLoginUser();
  for (const condition of conditions) {
    if (!condition.targetEvents.includes(screen)) {
      continue;
    }
    if (!condition.triggerTimings.includes(timing)) {
      continue;
    }
    if (!isConditionMet(condition, event.record)) {
      continue;
    }
    applyActions(condition, event.record, loginUser);
  }
  return event;
};

// --- 保存時（submit） ---
manager.add(['app.record.create.submit'], (event) => processEvent(event, 'create', 'submit'));
manager.add(['app.record.edit.submit'], (event) => processEvent(event, 'edit', 'submit'));

// --- 画面表示時（show） ---
manager.add(['app.record.create.show'], (event) => processEvent(event, 'create', 'show'));
manager.add(['app.record.edit.show'], (event) => processEvent(event, 'edit', 'show'));

// --- フィールド変更時（change） ---
// 変更検知の対象とするフィールドコードを、変更タイミングが有効な設定から収集する
const changeFieldCodes = new Set<string>();
for (const condition of store.get(validPluginConditionsAtom)) {
  if (!condition.triggerTimings.includes('change')) {
    continue;
  }
  for (const fieldCondition of condition.conditions) {
    if (fieldCondition.fieldCode) {
      changeFieldCodes.add(fieldCondition.fieldCode);
    }
  }
}

const createChangeEvents = [...changeFieldCodes].map((code) => `app.record.create.change.${code}`);
const editChangeEvents = [...changeFieldCodes].map((code) => `app.record.edit.change.${code}`);

if (createChangeEvents.length > 0) {
  manager.addChangeEvents(createChangeEvents, (event) => processEvent(event, 'create', 'change'));
}
if (editChangeEvents.length > 0) {
  manager.addChangeEvents(editChangeEvents, (event) => processEvent(event, 'edit', 'change'));
}
