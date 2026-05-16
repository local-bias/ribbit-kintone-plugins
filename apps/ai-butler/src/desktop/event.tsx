import { getAllRecords, getCurrentRecord, getQuery } from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { currentAppIdAtom, store } from '@repo/jotai';
import { nanoid } from 'nanoid';
import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID } from '@/lib/global';
import { isUsagePluginConditionMet } from '@/lib/plugin';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import App from './app';
import { pluginConfigAtom } from './public-state';
import { currentRecordIdAtom, kintoneContextAtom, screenKindAtom } from './states/chat';

const ROOT_ID = nanoid();

type ScreenKind = 'index' | 'detail' | 'create' | 'edit';

const EVENT_TO_SCREEN: Record<string, ScreenKind> = {
  'app.record.index.show': 'index',
  'app.record.detail.show': 'detail',
  'app.record.create.show': 'create',
  'app.record.edit.show': 'edit',
};

/** 画面が設定上有効か判定 */
function isScreenEnabled(common: PluginCommonConfig, screen: ScreenKind): boolean {
  switch (screen) {
    case 'index':
      return common.displayOnIndex;
    case 'detail':
      return common.displayOnDetail;
    case 'create':
      return common.displayOnCreate;
    case 'edit':
      return common.displayOnEdit;
  }
}

/**
 * 現在のレコード情報をテキスト化して返却します
 */
function buildRecordContext(eventRecord?: any): string {
  try {
    const record = eventRecord ?? getCurrentRecord().record;
    if (!record) {
      console.warn('[ai-butler] no record data found in current context');
      return '';
    }
    const json = JSON.stringify(record, null, 2);
    return [
      '# 表示中のレコード情報',
      '以下は、ユーザーが現在表示している kintone レコードの内容です。回答時に必要に応じて参照してください。',
      '',
      '```json',
      json,
      '```',
    ].join('\n');
  } catch (error) {
    console.warn('[ai-butler] failed to read current record', error);
    return '';
  }
}

/**
 * レコード一覧画面のレコード群をテキスト化して返却します
 */
async function buildRecordsContext(): Promise<string> {
  try {
    const appId = store.get(currentAppIdAtom);
    if (!appId) return '';
    const query = getQuery() ?? '';
    // limit/offset は getAllRecords 内で再付与されるため除去しておく
    const sanitized = query
      .replace(/\blimit\s+\d+/gi, '')
      .replace(/\boffset\s+\d+/gi, '')
      .trim();
    const records = await getAllRecords({
      app: appId,
      query: sanitized,
      guestSpaceId: GUEST_SPACE_ID,
    });
    const total = records.length;
    // 大きすぎる場合は先頭 50 件のみ提示
    const sample = records.slice(0, 50);
    const omitted = total - sample.length;
    const json = JSON.stringify(sample, null, 2);
    const header =
      `# 表示中の一覧レコード (合計 ${total} 件` +
      (omitted > 0 ? `, うち先頭 ${sample.length} 件のみ提示` : '') +
      ')';
    const queryNote = sanitized ? `\n\n適用クエリ: \`${sanitized}\`` : '';
    return `${header}${queryNote}\n\n\`\`\`json\n${json}\n\`\`\``;
  } catch (error) {
    console.warn('[ai-butler] failed to fetch list records', error);
    return '';
  }
}

manager.add(
  [
    'app.record.index.show',
    'app.record.detail.show',
    'app.record.create.show',
    'app.record.edit.show',
  ],
  async (event) => {
    const config = store.get(pluginConfigAtom);
    const screen = EVENT_TO_SCREEN[event.type];
    if (!screen) return event;

    if (!isScreenEnabled(config.common, screen)) {
      return event;
    }

    const hasValidCondition = config.conditions.some(isUsagePluginConditionMet);
    const anyFeatureEnabled =
      config.common.chatEnabled ||
      config.common.fileAttachmentEnabled ||
      config.common.autocompleteEnabled;
    if (!hasValidCondition && !anyFeatureEnabled) {
      return event;
    }

    // 画面情報を事前取得して chat の system プロンプトに注入
    store.set(screenKindAtom, screen);
    if (screen === 'index') {
      store.set(currentRecordIdAtom, null);
      const context = await buildRecordsContext();
      store.set(kintoneContextAtom, context);
    } else {
      const recordId = (event as { recordId?: string | number }).recordId ?? null;
      store.set(currentRecordIdAtom, recordId);
      const context = buildRecordContext(event.record);
      store.set(kintoneContextAtom, context);
    }

    ComponentManager.getInstance().renderComponent({ id: ROOT_ID, component: <App /> });
    return event;
  }
);
