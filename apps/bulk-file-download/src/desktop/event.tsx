import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import { PluginCondition } from '@/schema/plugin-config';
import config from '@/../plugin.config.mjs';
import { toast } from '@konomi-app/ui';
import {
  downloadFile,
  getApp,
  getAllRecords,
  getHeaderSpace,
  getQuery,
  getSpaceElement,
  kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { format as formatDateFns } from 'date-fns';
import { currentAppIdAtom, store } from '@repo/jotai';
import JSZip from 'jszip';
import { DownloadButton } from './components/download-button';
import { validPluginConditionsAtom } from './public-state';
import { css } from '@emotion/css';

/** アプリ情報のキャッシュ */
let appInfoCache: kintoneAPI.App | null = null;
const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
const componentManager = ComponentManager.getInstance();
componentManager.debug = isDev;

async function getAppInfo(): Promise<kintoneAPI.App> {
  if (appInfoCache) {
    return appInfoCache;
  }
  const appId = store.get(currentAppIdAtom);
  appInfoCache = await getApp({ id: appId, guestSpaceId: GUEST_SPACE_ID });
  return appInfoCache;
}

/**
 * date-fns で日付をフォーマットする。不正な形式は安全な既定値にフォールバックする。
 */
function formatDate(date: Date, format: string): string {
  try {
    return formatDateFns(date, format);
  } catch (error) {
    console.warn('Invalid date format template:', format, error);
    return formatDateFns(date, DEFAULT_DATE_FORMAT);
  }
}

/**
 * テンプレート文字列内の変数を解決する
 * - {{date:FORMAT}} → 現在日時をフォーマット
 * - {{appName}} → アプリ名
 * - {{appId}} → アプリID
 */
async function resolveTemplateVariables(template: string): Promise<string> {
  let result = template;

  // {{date:FORMAT}} の解決
  const datePattern = /\{\{date:([^}]+)\}\}/g;
  const now = new Date();
  result = result.replace(datePattern, (_, format: string) => formatDate(now, format));

  // {{appId}} の解決
  const appId = store.get(currentAppIdAtom);
  result = result.replaceAll('{{appId}}', String(appId));

  // {{appName}} の解決
  if (result.includes('{{appName}}')) {
    const app = await getAppInfo();
    result = result.replaceAll('{{appName}}', app.name);
  }

  return result;
}

/**
 * レコードデータから、指定されたフィールドコード群に対応する添付ファイル情報を抽出する
 */
function extractFileInfoFromRecord(
  record: kintoneAPI.RecordData,
  fieldCodes: string[]
): { fileName: string; fileKey: string }[] {
  const files: { fileName: string; fileKey: string }[] = [];

  for (const code of fieldCodes) {
    if (!code) continue;

    if (code.includes('.')) {
      // サブテーブル内のフィールド: "subtableCode.fieldCode"
      const [subtableCode, fieldCode] = code.split('.');
      const subtableField = record[subtableCode!];
      if (subtableField && subtableField.type === 'SUBTABLE') {
        for (const row of subtableField.value) {
          const field = row.value[fieldCode!];
          if (field && field.type === 'FILE') {
            for (const file of field.value) {
              files.push({ fileName: file.name, fileKey: file.fileKey });
            }
          }
        }
      }
    } else {
      // 通常フィールド
      const field = record[code];
      if (field && field.type === 'FILE') {
        for (const file of field.value) {
          files.push({ fileName: file.name, fileKey: file.fileKey });
        }
      }
    }
  }

  return files;
}

/**
 * ファイル名の重複を回避する
 */
function deduplicateFileNames(files: { fileName: string; fileKey: string }[]): typeof files {
  const nameCount = new Map<string, number>();
  return files.map((file) => {
    const count = nameCount.get(file.fileName) ?? 0;
    nameCount.set(file.fileName, count + 1);
    if (count === 0) {
      return file;
    }
    const dotIndex = file.fileName.lastIndexOf('.');
    const name = dotIndex >= 0 ? file.fileName.slice(0, dotIndex) : file.fileName;
    const ext = dotIndex >= 0 ? file.fileName.slice(dotIndex) : '';
    return { ...file, fileName: `${name} (${count})${ext}` };
  });
}

/**
 * 添付ファイルをまとめてZIPにし、ダウンロードする
 */
async function downloadFilesAsZip(
  files: { fileName: string; fileKey: string }[],
  zipFileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  const zip = new JSZip();
  const dedupedFiles = deduplicateFileNames(files);

  for (let i = 0; i < dedupedFiles.length; i++) {
    const file = dedupedFiles[i]!;
    onProgress?.(i + 1, dedupedFiles.length);
    const blob = await downloadFile({
      fileKey: file.fileKey,
      guestSpaceId: GUEST_SPACE_ID,
      debug: isDev,
    });
    zip.file(file.fileName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const resolvedName = await resolveTemplateVariables(zipFileName || 'attachments');
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${resolvedName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderDownloadButton(params: {
  id: string;
  parentElement: Element;
  label: string;
  onClick: () => Promise<void>;
}): void {
  componentManager.renderComponent({
    id: params.id,
    parentElement: params.parentElement,
    component: <DownloadButton label={params.label} onClick={params.onClick} />,
    onRootElementReady(element) {
      element.classList.add(css`
        display: inline-block;
      `);
    },
  });
}

function createButtonMountId(location: string, conditionId: string): string {
  return `${config.id}-${location}-${conditionId}`;
}

/**
 * 一覧画面用: 絞り込まれた全レコードの添付ファイルをダウンロード
 */
async function handleListDownload(condition: PluginCondition): Promise<void> {
  const appId = store.get(currentAppIdAtom);
  const query = getQuery() ?? '';

  const toastId = toast.loading(t('desktop.loading.downloadingFiles'));
  try {
    const records = await getAllRecords({
      app: appId,
      query,
      guestSpaceId: GUEST_SPACE_ID,
      debug: isDev,
    });

    const allFiles: { fileName: string; fileKey: string }[] = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i]!;
      allFiles.push(...extractFileInfoFromRecord(record, condition.fieldCodes));
    }

    if (allFiles.length === 0) {
      toast.update(toastId, {
        type: 'warning',
        message: t('desktop.download.noFiles'),
      });
      return;
    }

    await downloadFilesAsZip(allFiles, condition.zipFileName);
    toast.update(toastId, {
      type: 'success',
      message: t('desktop.download.success'),
    });
  } catch (error) {
    toast.update(toastId, {
      type: 'error',
      message: t('desktop.download.error'),
    });
    console.error(t('desktop.download.errorLog'), error);
  }
}

/**
 * レコード詳細画面用: 表示中レコードの添付ファイルをダウンロード
 */
async function handleDetailDownload(
  record: kintoneAPI.RecordData,
  condition: PluginCondition
): Promise<void> {
  const files = extractFileInfoFromRecord(record, condition.fieldCodes);

  if (files.length === 0) {
    toast.warning(t('desktop.download.noFiles'));
    return;
  }

  await downloadFilesAsZip(files, condition.zipFileName);
}

// 一覧画面のイベント
manager.add(['app.record.index.show'], async (event) => {
  const conditions = store.get(validPluginConditionsAtom);
  const listConditions = conditions.filter((c) => c.buttonLocation === 'list-header');

  if (listConditions.length === 0) {
    return event;
  }

  const headerSpace = getHeaderSpace(event.type);
  if (!headerSpace) {
    isDev && console.warn(t('warning.headerSpaceNotFound'));
    return event;
  }

  for (const condition of listConditions) {
    renderDownloadButton({
      id: createButtonMountId('list-header', condition.id),
      parentElement: headerSpace,
      label: condition.buttonLabel || t('desktop.defaultButtonLabel'),
      onClick: () => handleListDownload(condition),
    });
  }

  return event;
});

// 詳細・編集画面のイベント
manager.add(['app.record.detail.show', 'app.record.edit.show'], async (event) => {
  const conditions = store.get(validPluginConditionsAtom);
  const record = event.record;

  // ヘッダーに設置する条件
  const headerConditions = conditions.filter((c) => c.buttonLocation === 'detail-header');
  if (headerConditions.length > 0) {
    const headerSpace = getHeaderSpace(event.type);
    if (headerSpace) {
      for (const condition of headerConditions) {
        renderDownloadButton({
          id: createButtonMountId(`detail-header-${event.type}`, condition.id),
          parentElement: headerSpace,
          label: condition.buttonLabel || t('desktop.defaultButtonLabel'),
          onClick: () => handleDetailDownload(record, condition),
        });
      }
    }
  }

  // スペースフィールドに設置する条件
  const spaceConditions = conditions.filter((c) => c.buttonLocation === 'space' && c.spaceFieldId);
  for (const condition of spaceConditions) {
    const spaceElement = getSpaceElement(condition.spaceFieldId);
    if (spaceElement) {
      renderDownloadButton({
        id: createButtonMountId(`space-${condition.spaceFieldId}`, condition.id),
        parentElement: spaceElement,
        label: condition.buttonLabel || t('desktop.defaultButtonLabel'),
        onClick: () => handleDetailDownload(record, condition),
      });
    } else {
      isDev && console.warn(t('warning.spaceFieldNotFound', condition.spaceFieldId));
    }
  }

  return event;
});
