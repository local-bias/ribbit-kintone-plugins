import { getHeaderSpace, getSpaceElement, updateRecord } from '@konomi-app/kintone-utilities';
import { toast } from '@konomi-app/ui';
import config from '@/../plugin.config.mjs';
import { PLUGIN_NAME } from '@/lib/constants';
import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID } from '@/lib/global';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';
import type { PluginCondition } from '@/schema/plugin-config';
import { executeAIInference } from './orchestrator';
import { applyAIResponseToRecord, buildRecordUpdatePayload } from './record-writer';

const BUTTON_CONTAINER_ID = `🐸${config.id}-buttons`;

type ExecutionContext = 'edit' | 'create' | 'detail';

function detectContext(eventType: string): ExecutionContext {
  if (eventType.includes('.detail.')) {
    return 'detail';
  }
  if (eventType.includes('.create.')) {
    return 'create';
  }
  return 'edit';
}

function createHeaderButtonContainer(eventType: string): HTMLDivElement {
  const existing = document.getElementById(BUTTON_CONTAINER_ID);
  if (existing) {
    existing.innerHTML = '';
    return existing as HTMLDivElement;
  }

  const container = document.createElement('div');
  container.id = BUTTON_CONTAINER_ID;
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.padding = '8px';

  const headerSpace = getHeaderSpace(eventType);
  if (headerSpace) {
    headerSpace.append(container);
  }
  return container;
}

function createSpaceFieldButtonContainer(spaceFieldId: string): HTMLDivElement | null {
  const containerId = `${BUTTON_CONTAINER_ID}-${spaceFieldId}`;
  const existing = document.getElementById(containerId);
  if (existing) {
    existing.innerHTML = '';
    return existing as HTMLDivElement;
  }

  const spaceElement = getSpaceElement(spaceFieldId);
  if (!spaceElement) {
    console.warn(`[${PLUGIN_NAME}] スペースフィールド "${spaceFieldId}" が見つかりません`);
    return null;
  }

  const container = document.createElement('div');
  container.id = containerId;
  container.style.display = 'flex';
  container.style.gap = '8px';
  spaceElement.append(container);
  return container;
}

function createExecuteButton(
  condition: PluginCondition,
  container: HTMLDivElement,
  context: ExecutionContext
): void {
  const button = document.createElement('button');
  button.textContent = condition.buttonLabel || 'AI自動入力を実行';
  button.style.cssText =
    'padding: 8px 16px; border: none; border-radius: 4px; background-color: #3498db; color: #fff; cursor: pointer; font-size: 14px;';

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#2980b9';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#3498db';
  });

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = '処理中...';
    button.style.backgroundColor = '#95a5a6';
    button.style.cursor = 'not-allowed';

    try {
      const recordData = kintone.app.record.get();
      if (!recordData) {
        throw new Error('レコード情報を取得できませんでした');
      }

      const { aiResponse, resolvedFields } = await executeAIInference(condition, recordData.record);

      if (context === 'detail') {
        // 詳細画面: kintone.app.record.set() が使えないため REST API で更新
        const appId = kintone.app.getId();
        const recordId = kintone.app.record.getId();
        if (!appId || !recordId) {
          throw new Error('アプリIDまたはレコードIDを取得できませんでした');
        }
        const payload = buildRecordUpdatePayload(aiResponse, resolvedFields, recordData.record);
        await updateRecord({
          app: appId,
          id: recordId,
          record: payload,
          guestSpaceId: GUEST_SPACE_ID,
        });
        // 画面をリロードして更新結果を反映
        location.reload();
      } else {
        // 編集・作成画面: kintone.app.record.set() で更新
        applyAIResponseToRecord(recordData.record, aiResponse, resolvedFields);
        kintone.app.record.set(recordData);
        toast.success('AI自動入力が完了しました。内容を確認して保存してください。');
      }
    } catch (error) {
      console.error(`[${PLUGIN_NAME}] AI自動入力エラー:`, error);
      const message = error instanceof Error ? error.message : 'AI自動入力中にエラーが発生しました';
      toast.error(message);
    } finally {
      button.disabled = false;
      button.textContent = condition.buttonLabel || 'AI自動入力を実行';
      button.style.backgroundColor = '#3498db';
      button.style.cursor = 'pointer';
    }
  });

  container.append(button);
}

// 手動実行: 編集・作成・詳細画面にボタンを設置
manager.add(
  ['app.record.detail.show', 'app.record.edit.show', 'app.record.create.show'],
  (event) => {
    const pluginConfig = restorePluginConfig();
    const validConditions = pluginConfig.conditions.filter(isUsagePluginConditionMet);
    const context = detectContext(event.type);

    // ヘッダースペースに設置するボタン
    const manualConditions = validConditions.filter((c) => c.executionTiming === 'manual');
    if (manualConditions.length > 0) {
      const container = createHeaderButtonContainer(event.type);
      for (const condition of manualConditions) {
        createExecuteButton(condition, container, context);
      }
    }

    // スペースフィールドに設置するボタン
    const spaceFieldConditions = validConditions.filter(
      (c) => c.executionTiming === 'space_field' && c.spaceFieldId
    );
    for (const condition of spaceFieldConditions) {
      const container = createSpaceFieldButtonContainer(condition.spaceFieldId);
      if (container) {
        createExecuteButton(condition, container, context);
      }
    }

    return event;
  }
);

// 自動実行: 保存時イベント
// submit イベントでは kintone.app.record.get() が使えないため event.record を使用
manager.add(['app.record.edit.submit', 'app.record.create.submit'], async (event) => {
  const pluginConfig = restorePluginConfig();
  const validConditions = pluginConfig.conditions.filter(isUsagePluginConditionMet);
  const autoConditions = validConditions.filter((c) => c.executionTiming === 'on_save');

  if (autoConditions.length === 0) {
    return event;
  }

  for (const condition of autoConditions) {
    try {
      const { aiResponse, resolvedFields } = await executeAIInference(condition, event.record);
      applyAIResponseToRecord(event.record, aiResponse, resolvedFields);
    } catch (error) {
      console.error(`[${PLUGIN_NAME}] AI自動入力エラー:`, error);
      const message = error instanceof Error ? error.message : 'AI自動入力中にエラーが発生しました';
      event.error = `プラグイン「${PLUGIN_NAME}」: ${message}`;
      return event;
    }
  }

  return event;
});
