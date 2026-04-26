import {
  getAllRecords,
  getAppId,
  getQueryCondition,
  type kintoneAPI,
  type UpdateAllRecordsParams,
  updateAllRecords,
} from '@konomi-app/kintone-utilities';
import { dialog } from '@konomi-app/ui';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import type { PluginCondition } from '@/schema/plugin-config';
import { getAdjustedDate, validateRecord } from '../common-actions';

export const useBulkUpdate = (params: { condition: PluginCondition }) => {
  const { condition } = params;

  return async () => {
    try {
      const isProd = process.env.NODE_ENV !== 'development';

      // Step 1: 対象レコードの取得
      let targetRecords: kintoneAPI.RecordData[];
      try {
        dialog.showLoading(t('desktop.bulkUpdate.dialog.content.loader.getRecords'));
        const queryCondition = getQueryCondition() ?? '';
        targetRecords = await getAllRecords({
          app: getAppId()!,
          query: queryCondition,
          guestSpaceId: GUEST_SPACE_ID,
          debug: !isProd,
        });
      } catch (error) {
        if (!isProd) {
          console.error(error);
        }
        const message = getErrorMessage(error);
        await dialog.alert({
          type: 'error',
          title: t('desktop.bulkUpdate.dialog.content.error.getRecords'),
          description: message,
        });
        return;
      }

      // Step 2: 更新対象レコードの構築・バリデーション結果の収集
      const recordsToUpdate: UpdateAllRecordsParams['records'] = [];
      const skipped: { id: string; reason: string }[] = [];

      try {
        for (const record of targetRecords) {
          const validationResult = validateRecord({ record, condition });
          if (!validationResult.valid) {
            if (!isProd) {
              console.warn(validationResult.errorMessage);
            }
            skipped.push({
              id: String(record.$id?.value ?? ''),
              reason: validationResult.errorMessage,
            });
            continue;
          }

          const targetField = record[condition.targetFieldCode]!;
          const basisField = record[condition.basisFieldCode];
          const targetFieldType = targetField.type;

          const basisDate =
            condition.basisType === 'currentDate'
              ? DateTime.local()
              : DateTime.fromISO(basisField!.value as string);

          if (!basisDate.isValid) {
            const reason = `${t('desktop.validation.error.basisFieldCode.invalid')} (${basisDate.invalidReason ?? ''})`;
            if (!isProd) {
              console.warn(reason, record);
            }
            skipped.push({ id: String(record.$id?.value ?? ''), reason });
            continue;
          }

          let adjustedDate: DateTime;
          try {
            adjustedDate = getAdjustedDate({ basisDate, record, condition });
          } catch (error) {
            if (!isProd) {
              console.warn('[date/bulk-update] getAdjustedDate failed; skipping record.', {
                record,
                error,
              });
            }
            skipped.push({
              id: String(record.$id?.value ?? ''),
              reason: getErrorMessage(error),
            });
            continue;
          }

          if (!adjustedDate.isValid) {
            if (!isProd) {
              console.warn(
                '[date/bulk-update] Adjusted date is invalid; skipping record.',
                record,
                adjustedDate.invalidReason
              );
            }
            skipped.push({
              id: String(record.$id?.value ?? ''),
              reason: adjustedDate.invalidReason ?? 'Invalid adjusted date',
            });
            continue;
          }

          const value =
            targetFieldType === 'DATE' ? adjustedDate.toFormat('yyyy-MM-dd') : adjustedDate.toISO();

          recordsToUpdate.push({
            id: record.$id!.value as string,
            record: { [condition.targetFieldCode]: { value } },
          });
        }
      } catch (error) {
        if (!isProd) {
          console.error(error);
        }
        await dialog.alert({
          type: 'error',
          title: t('desktop.bulkUpdate.dialog.content.error.updateRecords'),
          description: getErrorMessage(error),
        });
        return;
      }

      // Step 3: 更新対象なし
      if (recordsToUpdate.length === 0) {
        await dialog.alert({
          type: 'info',
          title: t('desktop.bulkUpdate.dialog.content.notFound.title'),
          description: t('desktop.bulkUpdate.dialog.content.notFound.description'),
        });
        return;
      }

      // Step 4: 確認ダイアログ
      const confirmParts = [
        `<p>${escapeHtml(t('desktop.bulkUpdate.dialog.content.confirm.text1'))}</p>`,
        `<p>${escapeHtml(t('desktop.bulkUpdate.dialog.content.confirm.length'))}: <strong>${recordsToUpdate.length.toLocaleString()}${escapeHtml(t('desktop.bulkUpdate.dialog.content.confirm.unit'))}</strong></p>`,
      ];
      if (skipped.length > 0) {
        confirmParts.push(
          `<p style="color:orangered;">${escapeHtml(
            t('desktop.bulkUpdate.dialog.content.confirm.skipped')
          )}: <strong>${skipped.length.toLocaleString()}${escapeHtml(t('desktop.bulkUpdate.dialog.content.confirm.unit'))}</strong></p>`
        );
      }

      const result = await dialog.alert({
        type: 'warning',
        title: t('desktop.bulkUpdate.dialog.title'),
        html: confirmParts.join(''),
        showCancelButton: true,
        confirmButtonText: t('desktop.bulkUpdate.dialog.actions.run'),
        cancelButtonText: t('desktop.bulkUpdate.dialog.actions.cancel'),
      });

      if (!result.isConfirmed) return;

      // Step 5: 更新の実行
      try {
        dialog.showLoading(t('desktop.bulkUpdate.dialog.content.loader.updateRecords'));
        dialog.setProgress(0);

        await updateAllRecords({
          app: getAppId()!,
          records: recordsToUpdate,
          guestSpaceId: GUEST_SPACE_ID,
          debug: !isProd,
          onProgress: ({ done }) => {
            dialog.setProgress(Math.round((done / recordsToUpdate.length) * 100));
          },
        });

        await dialog.alert({
          type: 'success',
          title: t('desktop.bulkUpdate.dialog.content.success.title'),
          description: `${recordsToUpdate.length.toLocaleString()}${t('desktop.bulkUpdate.dialog.content.success.description')}`,
        });
      } catch (error) {
        if (!isProd) {
          console.error(error);
        }
        const fieldErrors = parseKintoneFieldErrors(error);
        if (fieldErrors.length > 0) {
          await dialog.alert({
            type: 'error',
            title: t('desktop.bulkUpdate.dialog.content.error.updateRecords'),
            html: buildFieldErrorsHtml(fieldErrors),
          });
        } else {
          const message = getErrorMessage(error);
          await dialog.alert({
            type: 'error',
            title: t('desktop.bulkUpdate.dialog.content.error.updateRecords'),
            html: `<details style="white-space:pre-wrap;"><summary style="cursor:pointer;color:orangered;">${escapeHtml(
              t('desktop.bulkUpdate.dialog.content.error.details')
            )}</summary><div style="max-height:200px; overflow:auto;">${escapeHtml(message)}</div></details>`,
          });
        }
      }
    } finally {
      dialog.hide();
    }
  };
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error !== 'object' || error === null) {
    return String(error);
  }
  const err = error as Record<string, any>;
  if ('message' in err) {
    return typeof err.message === 'string' ? err.message : String(err.message);
  }
  if ('code' in err) {
    return String(err.code);
  }
  if ('errors' in err) {
    const errors = err.errors;
    if (typeof errors !== 'object' || errors === null) {
      return String(errors);
    }
    if ('app' in errors) {
      const app = errors.app;
      if (typeof app !== 'object' || app === null) {
        return String(app);
      }
      if ('messages' in app && z.array(z.string()).safeParse(app.messages).success) {
        return (app.messages as string[]).join('\n');
      }
    }
    if ('query' in errors) {
      const q = errors.query;
      if (q && 'messages' in q && z.array(z.string()).safeParse(q.messages).success) {
        return (q.messages as string[]).join('\n');
      }
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * kintone APIから返却されるレコードのフィールドエラーを解析し、
 * フィールドコードとメッセージの配列を返す。
 *
 * 例: `records[15].対象フィールド.value` → `{ fieldCode: '対象フィールド', message: '必須です。' }`
 */
function parseKintoneFieldErrors(error: unknown): { fieldCode: string; message: string }[] {
  const results: { fieldCode: string; message: string }[] = [];
  const seen = new Set<string>();

  let errorObjects: any[];
  if (Array.isArray(error)) {
    errorObjects = error;
  } else if (error && typeof error === 'object' && Array.isArray((error as any).results)) {
    errorObjects = (error as any).results;
  } else {
    errorObjects = [error];
  }

  const fieldErrorSchema = z.object({ messages: z.array(z.string()) });

  for (const errObj of errorObjects) {
    const errors = errObj?.errors;
    if (!errors || typeof errors !== 'object') continue;

    for (const [key, value] of Object.entries(errors)) {
      const parsed = fieldErrorSchema.safeParse(value);
      if (!parsed.success) continue;

      const match = key.match(/^records\[\d+\]\.(.+)\.value$/);
      const fieldCode = match?.[1] ?? key;

      for (const message of parsed.data.messages) {
        const dedupeKey = `${fieldCode}::${message}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push({ fieldCode, message });
      }
    }
  }

  return results;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFieldErrorsHtml(fieldErrors: { fieldCode: string; message: string }[]): string {
  const items = fieldErrors
    .map(
      ({ fieldCode, message }) =>
        `<li style="margin-bottom:4px;"><strong>${escapeHtml(fieldCode)}</strong>: ${escapeHtml(message)}</li>`
    )
    .join('');

  return `
    <div style="max-height:320px;overflow-y:auto;text-align:left;padding:8px 12px;border:1px solid #e5e7eb;border-radius:4px;background-color:#fafafa;">
      <ul style="margin:0;padding-left:20px;list-style-type:disc;">${items}</ul>
    </div>
  `;
}
