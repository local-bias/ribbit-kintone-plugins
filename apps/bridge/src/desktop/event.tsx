import {
  type AddRecordParams,
  addRecord,
  deleteAllRecords,
  getAllRecords,
  getFormFields,
  type kintoneAPI,
  type UpdateAllRecordsParams,
  updateAllRecords,
} from '@konomi-app/kintone-utilities';
import type { FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import { dialog } from '@konomi-app/ui';
import { allKintoneAppsAtom, store } from '@repo/jotai';
import { manager } from '@/lib/event-manager';
import { isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';
import {
  canExecuteAction,
  generateErrorLog,
  getAbstractEventType,
  getDynamicDstQuery,
  resolveBindingValue,
  shouldExecuteForProcess,
} from './actions';

const allEvents: kintoneAPI.js.EventType[] = [
  'app.record.create.submit.success',
  'app.record.edit.submit.success',
  'app.record.index.edit.submit.success',
  // 'app.record.detail.delete.submit',
  // 'app.record.index.delete.submit',
  // 'app.record.detail.process.proceed',
];

manager.add(
  ['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show'],
  async (event) => {
    // レコード作成・編集・詳細画面の表示イベントでは、アプリ情報を事前に取得しておく
    const { config } = restorePluginConfig();
    if (config.conditions.length === 0) {
      return event;
    }

    await store.get(allKintoneAppsAtom);

    return event;
  }
);

manager.add(allEvents, async (event) => {
  try {
    const abstractType = getAbstractEventType(event.type);
    if (!abstractType) {
      if (isDev) {
        console.warn(`未対応のイベントタイプ: ${event.type}`);
      }
      return event;
    }

    dialog.showLoading('アプリ情報を取得しています');
    const { config } = restorePluginConfig();

    const currentRecord = event.record;

    // triggerEvents でフィルタ
    let conditions = config.conditions.filter(isUsagePluginConditionMet).filter((condition) => {
      const triggerEvents = condition.triggerEvents ?? ['create', 'update'];
      return triggerEvents.includes(abstractType);
    });

    // プロセスイベントの場合、アクション・ステータスでさらにフィルタ
    if (abstractType === 'process') {
      const processEvent = event as unknown as {
        action: { value: string };
        nextStatus: { value: string };
      };
      conditions = conditions.filter((condition) =>
        shouldExecuteForProcess({
          condition,
          action: processEvent.action.value,
          nextStatus: processEvent.nextStatus.value,
        })
      );
    }

    if (conditions.length === 0) {
      dialog.hide();
      return event;
    }

    const apps = await store.get(allKintoneAppsAtom);

    // まず画面通知用にアプリ情報を取得しておく
    const targetApps: { [conditionId: string]: kintoneAPI.App | null } = {};
    for (const condition of conditions) {
      const app = apps.find((app) => app.appId === condition.dstAppId);
      targetApps[condition.id] = app ?? null;
    }

    const queueTitle =
      abstractType === 'delete'
        ? '関連する他のアプリを処理しています'
        : '関連する他のアプリを更新しています';

    dialog.showQueue(
      conditions.map((condition) => {
        const app = targetApps[condition.id];
        const appName = app ? app.name : `アプリID ${condition.dstAppId}`;
        return { key: condition.id, label: appName };
      }),
      queueTitle
    );

    const logs: { message: string; status: 'success' | 'skip' | 'error' }[] = [];

    for (const condition of conditions) {
      let log = '';
      let logStatus: 'success' | 'skip' | 'error' = 'success';
      try {
        dialog.activateQueue(condition.id);
        const {
          srcKeyFieldCode,
          dstAppId,
          dstSpaceId,
          isDstAppGuestSpace,
          dstKeyFieldCode,
          dstQuery,
          bindings,
        } = condition;
        const app = apps.find((app) => app.appId === dstAppId);
        const appName = app ? app.name : `アプリID ${dstAppId}`;

        const guestSpaceId = isDstAppGuestSpace ? (dstSpaceId ?? undefined) : undefined;

        // 実行条件の判定
        const srcRecord = event.record;
        const currentRecordId =
          'recordId' in event
            ? String((event as { recordId: number }).recordId)
            : (currentRecord.$id?.value as string);

        const dynamicQuery = `$id = ${currentRecordId}`;
        const srcQuery = condition.srcQuery
          ? `${condition.srcQuery} and ${dynamicQuery}`
          : dynamicQuery;

        const canExecute = await canExecuteAction({
          record: srcRecord,
          query: srcQuery,
          srcConditions: condition.srcConditions as FieldConditionValue[],
        });

        if (!canExecute) {
          log = `${appName}: レコードが実行条件を満たさないため、処理をスキップしました`;
          logs.push({ message: log, status: 'skip' });
          dialog.skipQueue(condition.id);
          continue;
        }

        const srcKeyField = srcRecord[srcKeyFieldCode];

        const { properties: dstProperties } = await getFormFields({
          app: dstAppId,
          guestSpaceId,
          debug: isDev,
        });
        const dstKeyFieldProperty = Object.values(dstProperties).find(
          (property) => property.code === dstKeyFieldCode
        );
        if (!dstKeyFieldProperty) {
          log = `${appName}: ${dstAppId}にフィールドコード: ${dstKeyFieldCode} が存在しないため、処理をスキップしました`;
          logs.push({ message: log, status: 'skip' });
          dialog.skipQueue(condition.id);
          continue;
        }

        const dynamicDstQuery = getDynamicDstQuery({ srcKeyField, dstKeyFieldProperty });
        const combinedDstQuery = dstQuery ? `${dstQuery} and ${dynamicDstQuery}` : dynamicDstQuery;

        // deleteRelatedRecords の場合: 連携先レコードを削除
        if (condition.deleteRelatedRecords) {
          const dstRecords = await getAllRecords({
            app: dstAppId,
            guestSpaceId,
            query: combinedDstQuery,
            fields: ['$id'],
            debug: isDev,
          });

          if (dstRecords.length === 0) {
            log = `${appName}: 削除対象のレコードが存在しませんでした`;
            logStatus = 'skip';
            dialog.skipQueue(condition.id);
          } else {
            const ids = dstRecords.map((record) => Number(record.$id.value));
            await deleteAllRecords({
              app: Number(dstAppId),
              ids,
              guestSpaceId,
              debug: isDev,
            });
            log = `${appName}: 対象レコード${dstRecords.length}件を削除しました`;
            logStatus = 'success';
            dialog.completeQueue(condition.id);
          }
        } else {
          // 既存の更新/作成ロジック
          const dstRecords = await getAllRecords({
            app: dstAppId,
            guestSpaceId,
            query: combinedDstQuery,
            fields: ['$id', ...bindings.map((binding) => binding.dstFieldCode)],
            debug: isDev,
          });

          if (dstRecords.length === 0) {
            if (condition.createIfNotExists) {
              const newRecord: AddRecordParams['record'] = {};
              for (const binding of bindings) {
                const dstProperty = dstProperties[binding.dstFieldCode];
                if (!dstProperty) {
                  console.warn(
                    `更新先アプリのフィールド: ${binding.dstFieldCode} が存在しないため、スキップされました`
                  );
                  continue;
                }
                const value = resolveBindingValue({
                  binding,
                  srcRecord,
                  dstPropertyType: dstProperty.type,
                });
                if (value === null) {
                  console.warn(
                    `バインディング ${binding.id} の値を解決できなかったため、スキップされました`
                  );
                  continue;
                }
                newRecord[binding.dstFieldCode] = { value };
              }
              await addRecord({
                app: dstAppId,
                guestSpaceId,
                record: newRecord,
                debug: isDev,
              });
              log = `${appName}: 対象レコードが存在しなかったため、新規作成しました`;
              logStatus = 'success';
              dialog.completeQueue(condition.id);
            } else {
              log = `${appName}: 対象レコードが存在しないため、データは更新されませんでした`;
              logStatus = 'skip';
              dialog.skipQueue(condition.id);
            }
          } else {
            const dstNewRecords: UpdateAllRecordsParams['records'] = dstRecords.map((record) => {
              const newRecord: UpdateAllRecordsParams['records'][number] = {
                id: record.$id.value as string,
                record: {},
              };
              for (const binding of bindings) {
                const dstProperty = dstProperties[binding.dstFieldCode];
                if (!dstProperty) {
                  console.warn(
                    `更新先アプリのフィールド: ${binding.dstFieldCode} が存在しないため、スキップされました`
                  );
                  continue;
                }
                const value = resolveBindingValue({
                  binding,
                  srcRecord,
                  dstPropertyType: dstProperty.type,
                });
                if (value === null) {
                  console.warn(
                    `バインディング ${binding.id} の値を解決できなかったため、スキップされました`
                  );
                  continue;
                }
                newRecord.record[binding.dstFieldCode] = { value };
              }
              return newRecord;
            });
            const { records: results } = await updateAllRecords({
              app: dstAppId,
              guestSpaceId,
              records: dstNewRecords,
              debug: isDev,
            });
            log = `${appName}: 対象レコード${results.length}件を更新しました`;
            logStatus = 'success';
            dialog.completeQueue(condition.id);
          }
        }
      } catch (error: any) {
        dialog.failQueue(condition.id);
        console.error(error);
        log = generateErrorLog(error);
        logStatus = 'error';
      }
      logs.push({ message: log, status: logStatus });
    }

    if (config.common.showResult) {
      const statusStyle = {
        success: { border: '#2e7d32', bg: '#f1f8e9', icon: '✓' },
        skip: { border: '#ed6c02', bg: '#fff3e0', icon: '–' },
        error: { border: '#c62828', bg: '#ffebee', icon: '✗' },
      };
      const logHtml = logs
        .map(({ message, status }) => {
          const { border, icon } = statusStyle[status];
          return [
            `<div style="display:flex;align-items:flex-start;padding:8px 12px;margin:4px 0;`,
            `border-left:4px solid ${border};border-radius:0 4px 4px 0;">`,
            `<span style="font-weight:bold;color:${border};margin-right:8px;flex-shrink:0;">${icon}</span>`,
            `<span style="word-break:break-word;">${message}</span>`,
            `</div>`,
          ].join('');
        })
        .join('');
      await dialog.alert({
        title: t('desktop.resultDialog.title'),
        html: `<div style="font-size:14px;text-align:left;min-width:400px;">${logHtml}</div>`,
        type: 'info',
      });
    } else {
      // 最後のタスクの実行可否が画面上で判断できない場合があるため、0.3秒待ってから完了とする
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } finally {
    dialog.hide();
  }

  return event;
});
