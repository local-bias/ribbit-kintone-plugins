import { QUERY_PARAM_KEY } from '@/lib/constants';
import { manager } from '@/lib/event-manager';
import { isDev } from '@/lib/global';
import { ActionParamSchema } from '@/schema/action-values';
import { decompressFromEncodedURIComponent } from 'lz-string';

manager.add(['app.record.create.show'], (event) => {
  // クエリパラメータを取得し、プラグインのキーが存在する場合に処理を実行
  const queryParams = new URLSearchParams(window.location.search);
  const paramValue = queryParams.get(QUERY_PARAM_KEY);
  if (!paramValue) {
    return event;
  }
  const decoded = JSON.parse(decompressFromEncodedURIComponent(paramValue) ?? '{}');

  const parsed = ActionParamSchema.safeParse(decoded);
  if (!parsed.success) {
    console.error('クエリパラメータの値が不正です', parsed.error);
    return event;
  }

  const { values } = parsed.data;

  isDev && console.log('設定前のレコード', event.record);

  isDev && console.log('設定値', values);

  for (const [fieldCode, { value }] of Object.entries(values)) {
    const field = event.record[fieldCode];
    if (!field) {
      console.warn('フィールドが存在しません', fieldCode);
      continue;
    }
    field.value = value;
  }

  isDev && console.log('設定後のレコード', event.record);

  return event;
});
