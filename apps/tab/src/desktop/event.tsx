import { isMobile, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { store } from '@repo/jotai';
import config from '@/../plugin.config.mjs';
import { PLUGIN_ROOT_ID, RECORD_LAYOUT_CLASS, RECORD_ROOT_SELECTOR } from '@/lib/constants';
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
  selectedConditionAtom,
  selectedTabIndexAtom,
  validPluginConditionsAtom,
  visiblePluginConditionsAtom,
} from './public-state';
import { handleInitialTabResolveAtom, handleVisibleConditionsChangeAtom } from './states/tab';

const componentManager = ComponentManager.getInstance();
componentManager.debug = isDev;

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
  manager.addChangeEvents(events, (event) => {
    store.set(currentRecordAtom, event.record);
    void store.set(handleVisibleConditionsChangeAtom);
    return event;
  });
};

manager.add(SHOW_EVENTS, async (event) => {
  // モバイルはレコード画面のレイアウトが異なるため、タブの描画対象外とする
  if (isMobile(event.type)) {
    return event;
  }

  if (store.get(validPluginConditionsAtom).length === 0) {
    return event;
  }

  store.set(currentScreenAtom, toTargetScreen(event.type));
  store.set(currentRecordAtom, event.record);

  // 表示できるタブが1つも無い場合は、レイアウトを変更せずに何もしない
  if ((await store.get(visiblePluginConditionsAtom)).length === 0) {
    return event;
  }

  await store.set(handleInitialTabResolveAtom);
  registerFieldWatchers();

  const target = document.querySelector(RECORD_ROOT_SELECTOR);
  if (!target) {
    console.warn(`[plugin] ${t('desktop.error.rootNotFound')}`, RECORD_ROOT_SELECTOR);
    return event;
  }
  target.classList.add(RECORD_LAYOUT_CLASS);

  componentManager.renderComponent({
    id: `🐸${config.id}-root`,
    component: <App />,
    parentElement: target,
    prepend: true,
    // タブUIのCSSはこのidを起点に詳細度を確保しているため、必ず付与する
    // (`🐸`はプラグイン共通のスタイルスコープ)
    onRootElementReady: (element) => {
      element.id = PLUGIN_ROOT_ID;
      element.classList.add('🐸');
    },
  });

  await refresh();

  return event;
});

/**
 * 保存時に、未入力の必須フィールドが非表示のタブにある場合は、そのタブへ切り替えます
 *
 * kintoneは非表示のフィールドも必須チェックの対象にするため、
 * 切り替えておかないとエラーの原因が画面上に見えません。
 *
 * 判定を誤って保存を妨げることが無いよう、保存自体は中断しません
 * (未入力であれば、この後にkintone自身が保存を中断します)。
 */
manager.add(SUBMIT_EVENTS, async (event) => {
  if (isMobile(event.type)) {
    return event;
  }
  if (!store.get(pluginCommonConfigAtom).notifiesMissingRequiredFields) {
    return event;
  }

  store.set(currentRecordAtom, event.record);

  const missing = await store.get(missingRequiredFieldCodesAtom);
  if (missing.length === 0) {
    return event;
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
    return event;
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
    return event;
  }

  store.set(selectedTabIndexAtom, targetIndex);
  await refresh();
  isDev && console.log('⚠ 未入力の必須フィールドを含むタブへ切り替えました', missing);

  return event;
});
