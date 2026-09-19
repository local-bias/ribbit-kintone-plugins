import { isMobile, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { store } from '@repo/jotai';
import { RECORD_LAYOUT_CLASS, RECORD_ROOT_SELECTOR } from '@/lib/constants';
import { manager } from '@/lib/event-manager';
import { isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getWatchedFieldCodes } from '@/lib/tab-visibility';
import { shouldShowKey } from '@/lib/visibility';
import type { TargetScreen } from '@/schema/plugin-config';
import { refresh } from './actions';
import App from './components';
import {
  currentRecordAtom,
  currentScreenAtom,
  missingRequiredFieldCodesAtom,
  pluginCommonConfigAtom,
  resolveViewerAtom,
  selectedConditionAtom,
  selectedTabIndexAtom,
  validPluginConditionsAtom,
  visiblePluginConditionsAtom,
} from './public-state';
import { mountTabList } from './render';
import { handleInitialTabResolveAtom, handleVisibleConditionsChangeAtom } from './states/tab';

const SHOW_EVENTS = [
  'app.record.create.show',
  'app.record.edit.show',
  'app.record.detail.show',
] as const satisfies kintoneAPI.js.EventType[];

const SUBMIT_EVENTS = [
  'app.record.create.submit',
  'app.record.edit.submit',
] as const satisfies kintoneAPI.js.EventType[];

/** イベントタイプから、タブの表示条件で使用する画面種別を判定します */
const toTargetScreen = (eventType: string): TargetScreen => {
  if (eventType.includes('create')) {
    return 'create';
  }
  if (eventType.includes('edit')) {
    return 'edit';
  }
  return 'detail';
};

/**
 * 表示条件が参照するフィールドの変更を監視し、タブの表示を再評価します
 *
 * 監視対象のフィールドコードは設定情報から決まるため、一度だけ登録します
 */
let watchRegistered = false;
const registerFieldWatchers = () => {
  if (watchRegistered) {
    return;
  }
  watchRegistered = true;

  const conditions = store.get(validPluginConditionsAtom);
  const codes = getWatchedFieldCodes(conditions);
  if (codes.length === 0) {
    return;
  }

  const events = ['app.record.create.change', 'app.record.edit.change'].flatMap((prefix) =>
    codes.map((code) => `${prefix}.${code}`)
  );

  // changeイベントのハンドラはPromiseを返却できないため、
  // レコードの反映だけを同期的に行い、再描画は待たずに実行します
  // (待たない以上、失敗はここで受け止めないとunhandled rejectionになります)
  manager.addChangeEvents(events, (event) => {
    store.set(currentRecordAtom, event.record);
    store.set(handleVisibleConditionsChangeAtom).catch((error: unknown) => {
      console.error(`[plugin] ${t('desktop.error.render')}`, error);
    });
    return event;
  });
};

/**
 * レコード画面へタブを描画し、選択中のタブに合わせて表示を切り替えます
 *
 * 例外は呼び出し元で握りつぶすため、この関数の中では素直に投げて構いません
 */
const renderTabs = async (event: kintoneAPI.js.Event) => {
  // モバイルはレコード画面のレイアウトが異なるため、タブの描画対象外とする
  if (isMobile(event.type)) {
    return;
  }

  if (store.get(validPluginConditionsAtom).length === 0) {
    return;
  }

  store.set(currentScreenAtom, toTargetScreen(event.type));
  store.set(currentRecordAtom, event.record);
  await store.set(resolveViewerAtom);

  // 表示できるタブが1つも無い場合は、レイアウトを変更せずに何もしない
  if (store.get(visiblePluginConditionsAtom).length === 0) {
    return;
  }

  await store.set(handleInitialTabResolveAtom);
  registerFieldWatchers();

  const target = document.querySelector(RECORD_ROOT_SELECTOR);
  if (!target) {
    console.warn(`[plugin] ${t('desktop.error.rootNotFound')}`, RECORD_ROOT_SELECTOR);
    return;
  }
  target.classList.add(RECORD_LAYOUT_CLASS);

  mountTabList(<App />, target);

  await refresh();
};

/**
 * タブの描画は、失敗してもレコード画面の表示を妨げてはいけません
 *
 * イベントマネージャへ例外を渡すと`event.error`が設定され、レコード画面に
 * プラグインのエラーが表示されてしまうため、ここで握りつぶして記録だけ行います。
 * タブが出ないだけで、レコード自体は通常どおり閲覧・編集できます。
 */
manager.add(SHOW_EVENTS, async (event) => {
  try {
    await renderTabs(event);
  } catch (error) {
    console.error(`[plugin] ${t('desktop.error.render')}`, error);
  }
  return event;
});

/**
 * 未入力の必須フィールドが非表示のタブにある場合に、そのタブへ切り替えます
 *
 * kintoneは非表示のフィールドも必須チェックの対象にするため、
 * 切り替えておかないとエラーの原因が画面上に見えません。
 *
 * 例外は呼び出し元で握りつぶすため、この関数の中では素直に投げて構いません
 */
const switchToTabWithMissingRequiredField = async (event: kintoneAPI.js.Event) => {
  if (isMobile(event.type)) {
    return;
  }
  if (!store.get(pluginCommonConfigAtom).notifiesMissingRequiredFields) {
    return;
  }

  store.set(currentRecordAtom, event.record);

  const missing = await store.get(missingRequiredFieldCodesAtom);
  if (missing.length === 0) {
    return;
  }

  const selected = await store.get(selectedConditionAtom);
  const isVisibleInSelectedTab =
    selected !== null &&
    missing.some((code) =>
      shouldShowKey({
        displayMode: selected.fieldDisplayMode,
        selected: selected.fields,
        key: code,
      })
    );
  if (isVisibleInSelectedTab) {
    return;
  }

  const conditions = await store.get(visiblePluginConditionsAtom);
  const targetIndex = conditions.findIndex((condition) =>
    missing.some((code) =>
      shouldShowKey({
        displayMode: condition.fieldDisplayMode,
        selected: condition.fields,
        key: code,
      })
    )
  );
  if (targetIndex === -1) {
    return;
  }

  store.set(selectedTabIndexAtom, targetIndex);
  await refresh();
  isDev && console.log('⚠ 未入力の必須フィールドを含むタブへ切り替えました', missing);
};

/**
 * この処理は保存を助けるためのものなので、失敗しても保存を妨げてはいけません
 *
 * イベントマネージャへ例外を渡すと`event.error`が設定され、kintoneが保存を中断します。
 * 判定にはアプリのフィールド情報の取得(REST API)を伴い、通信の失敗もありうるため、
 * ここで握りつぶして記録だけ行い、保存はそのまま続行させます
 * (未入力であれば、この後にkintone自身が保存を中断します)。
 */
manager.add(SUBMIT_EVENTS, async (event) => {
  try {
    await switchToTabWithMissingRequiredField(event);
  } catch (error) {
    console.error(`[plugin] ${t('desktop.error.submit')}`, error);
  }
  return event;
});
