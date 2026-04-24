import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getId } from '@/lib/utils';
import {
  getAllRecords,
  getQueryCondition,
  kintoneAPI,
  updateAllRecords,
  UpdateAllRecordsParams,
} from '@konomi-app/kintone-utilities';
import { dialog } from '@konomi-app/ui';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import { currentAppFieldsAtom, currentAppIdAtom, loadingCountAtom } from '../public-state';
import { useCondition } from './components/condition-context';
import z from 'zod';

export const useBulkRegenerate = () => {
  const { condition } = useCondition();

  return useAtomCallback(
    useCallback(
      async (get, set) => {
        // Step 1: Fetch records
        set(loadingCountAtom, (c) => c + 1);
        let records: kintoneAPI.RecordData[];
        try {
          dialog.showLoading(t('desktop.bulkRegenerate.dialog.content.loader.getRecords'));
          const query = getQueryCondition() ?? '';
          records = await getAllRecords({
            app: get(currentAppIdAtom),
            query,
            fields: ['$id', condition.fieldCode],
            guestSpaceId: GUEST_SPACE_ID,
            debug: !isProd,
          });
        } catch (error) {
          const message = getErrorMessage(error);
          await dialog.alert({
            type: 'error',
            title: t('desktop.bulkRegenerate.dialog.content.error.getRecords'),
            description: message,
          });
          set(loadingCountAtom, (c) => c - 1);
          return;
        }
        dialog.hide();
        set(loadingCountAtom, (c) => c - 1);

        // Step 2: Confirm
        const fields = await get(currentAppFieldsAtom);
        const fieldLabel =
          fields.find((f) => f.code === condition.fieldCode)?.label ?? condition.fieldCode;

        const result = await dialog.alert({
          type: 'warning',
          title: t('desktop.bulkRegenerate.dialog.title'),
          html: `
            <p>${t('desktop.bulkRegenerate.dialog.content.confirm.text1')}<span style="color:orangered">${t('desktop.bulkRegenerate.dialog.content.confirm.text2')}</span></p>
            <p>${t('desktop.bulkRegenerate.dialog.content.confirm.text3')}</p>
            <p>${t('desktop.bulkRegenerate.dialog.content.confirm.field')}: <strong>${fieldLabel}</strong></p>
            <p>${t('desktop.bulkRegenerate.dialog.content.confirm.length')}: <strong>${records.length.toLocaleString()}${t('desktop.bulkRegenerate.dialog.content.confirm.unit')}</strong></p>
          `,
          showCancelButton: true,
          confirmButtonText: t('desktop.bulkRegenerate.dialog.actions.run'),
          cancelButtonText: t('desktop.bulkRegenerate.dialog.actions.cancel'),
        });

        if (!result.isConfirmed) return;

        // Step 3: Update records
        set(loadingCountAtom, (c) => c + 1);
        try {
          dialog.showLoading(t('desktop.bulkRegenerate.dialog.content.loader.updateRecords'));
          dialog.setProgress(0);

          const filtered = records.filter(
            (record) => !!record.$id?.value && record[condition.fieldCode]?.value !== undefined
          );

          const newRecords: UpdateAllRecordsParams['records'] = filtered.map((record) => ({
            id: record.$id!.value as string,
            record: { [condition.fieldCode]: { value: getId({ condition, record }) } },
          }));

          await updateAllRecords({
            app: get(currentAppIdAtom),
            records: newRecords,
            guestSpaceId: GUEST_SPACE_ID,
            debug: !isProd,
            onProgress: ({ done }) => {
              dialog.setProgress(Math.round((done / newRecords.length) * 100));
            },
          });

          await dialog.alert({
            type: 'success',
            title: t('desktop.bulkRegenerate.dialog.content.success'),
          });
        } catch (error) {
          if (!isProd) {
            console.error(error);
          }
          const fieldErrors = parseKintoneFieldErrors(error);
          if (fieldErrors.length > 0) {
            await dialog.alert({
              type: 'error',
              title: t('desktop.bulkRegenerate.dialog.content.error.updateRecords'),
              html: buildFieldErrorsHtml(fieldErrors),
            });
          } else {
            const message = getErrorMessage(error);
            await dialog.alert({
              type: 'error',
              title: t('desktop.bulkRegenerate.dialog.content.error.updateRecords'),
              html: `<details style="white-space:pre-wrap;"><summary style="cursor:pointer;color:orangered;">${'エラーの詳細'}</summary><div style="max-height:200px; overflow:auto;">${escapeHtml(message)}</div></details>`,
            });
          }
        } finally {
          set(loadingCountAtom, (c) => c - 1);
        }
      },
      [condition]
    )
  );
};

function getErrorMessage(error: any) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error !== 'object' || error === null) {
    return String(error);
  }
  if ('message' in error) {
    if (typeof error.message === 'string') {
      return error.message;
    }
    return String(error.message);
  }
  if ('code' in error) {
    return String(error.code);
  }
  if ('errors' in error) {
    if (typeof error.errors !== 'object' || error.errors === null) {
      return String(error.errors);
    }
    if ('app' in error.errors) {
      if (typeof error.errors.app !== 'object' || error.errors.app === null) {
        return String(error.errors.app);
      }
      if (
        'messages' in error.errors.app &&
        z.array(z.string()).safeParse(error.errors.app.messages).success
      ) {
        return error.errors.app.messages.join('\n');
      }
    }
    if ('query' in error.errors) {
      if (
        'messages' in error.errors.query &&
        z.array(z.string()).safeParse(error.errors.query.messages).success
      ) {
        return error.errors.query.messages.join('\n');
      }
    }
  }
  return JSON.stringify(error);
}

/**
 * kintone APIから返却されるレコードのフィールドエラーを解析し、
 * フィールドコードとメッセージの配列を返す。
 *
 * 例: `records[15].文字列__1行_.value` → `{ fieldCode: '文字列__1行_', message: '必須です。' }`
 */
function parseKintoneFieldErrors(error: any): { fieldCode: string; message: string }[] {
  const results: { fieldCode: string; message: string }[] = [];
  const seen = new Set<string>();

  // エラーは `{ results: [...] }`、配列、単一オブジェクトのいずれの形式でも受け取れるようにする
  let errorObjects: any[];
  if (Array.isArray(error)) {
    errorObjects = error;
  } else if (error && typeof error === 'object' && Array.isArray(error.results)) {
    errorObjects = error.results;
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

      // `records[INDEX].FIELD_CODE.value` のような形式からフィールドコードを抽出する
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
