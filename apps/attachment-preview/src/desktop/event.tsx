import {
  getFieldElement,
  getQuery,
  getRecords,
  isMobile,
  type kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { currentAppIdAtom, store } from '@repo/jotai';
import { clone, entries } from 'remeda';
import config from '@/../plugin.config.mjs';
import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { createPreviewButton, registerAttachmentPreviewIntegration } from './actions';
import App from './components';
import { fileFieldsAtom, targetRecordAtom } from './public-state';

const componentManager = ComponentManager.getInstance();
componentManager.debug = isDev;

componentManager.renderComponent({
  id: `🐸${config.id}-root`,
  component: <App />,
  parentElement: document.body,
});
registerAttachmentPreviewIntegration();

type FileField = kintoneAPI.field.File & { code: string };

/** レコードからすべての添付ファイルフィールドを抽出します */
function extractFileFields(record: kintoneAPI.RecordData): FileField[] {
  const fileFields = entries(record).filter(([, field]) => field.type === 'FILE') as [
    key: string,
    value: kintoneAPI.field.File,
  ][];
  return fileFields.map(([code, { type, value }]) => ({ code, type, value }));
}

/**
 * `li`要素（添付ファイルのリスト表示）内のアンカーに対してプレビューボタンを付与します。
 * 同名ファイルが複数存在する場合に備えて、マッチしたファイルは候補から取り除きます。
 */
function appendButtonsToListItems(field: FileField, listItems: HTMLLIElement[]) {
  const cloned = clone(field);
  for (const listItem of listItems) {
    const anchorElement = listItem.querySelector('a');
    const anchorText = anchorElement?.textContent;
    if (!anchorText) continue;

    const targetFileIndex = cloned.value.findIndex((file) => file.name === anchorText);
    if (targetFileIndex === -1) continue;
    const targetFile = cloned.value[targetFileIndex];
    if (!targetFile) continue;

    listItem.append(
      createPreviewButton({
        key: targetFile.fileKey,
        name: targetFile.name,
        contentType: targetFile.contentType,
      })
    );
    cloned.value = cloned.value.toSpliced(targetFileIndex, 1);
  }
}

/** モバイル表示（アンカーのみ）に対してプレビューボタンを付与します */
function appendButtonsToAnchors(field: FileField, anchorElements: HTMLAnchorElement[]) {
  const cloned = clone(field);
  for (const anchorElement of anchorElements) {
    const anchorText = anchorElement.textContent;
    if (!anchorText) continue;

    const targetFileIndex = cloned.value.findIndex((file) => file.name === anchorText);
    if (targetFileIndex === -1) continue;
    const targetFile = cloned.value[targetFileIndex];
    if (!targetFile) continue;

    anchorElement.append(
      createPreviewButton({
        key: targetFile.fileKey,
        name: targetFile.name,
        contentType: targetFile.contentType,
      })
    );
    cloned.value = cloned.value.toSpliced(targetFileIndex, 1);
  }
}

manager.add(['app.record.index.show'], async (event) => {
  const { records } = await getRecords({
    app: store.get(currentAppIdAtom),
    query: getQuery() ?? '',
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });

  const table =
    document.querySelector('table.recordlist-gaia') ??
    document.querySelector('table.gaia-mobile-v2-app-index-recordlist-table');

  const tableRows = Array.from(table?.querySelectorAll('tbody tr') ?? []);

  tableRows.forEach((row, index) => {
    const record = records[index];
    if (!record) return;

    const fileFields = extractFileFields(record).filter((field) => field.value.length > 0);
    const listItems = Array.from(row.querySelectorAll('li')) as HTMLLIElement[];

    for (const field of fileFields) {
      appendButtonsToListItems(field, listItems);
    }
  });

  return event;
});

manager.add(['app.record.detail.show', 'app.record.edit.show'], async (event) => {
  store.set(targetRecordAtom, event.record);

  const fileFields = store.get(fileFieldsAtom).filter((field) => field.value.length > 0);

  for (const field of fileFields) {
    const fieldElement = getFieldElement(field.code);
    if (!fieldElement) continue;

    if (!isMobile()) {
      const listItems = Array.from(fieldElement.querySelectorAll('li')) as HTMLLIElement[];
      appendButtonsToListItems(field, listItems);
    } else {
      const anchorElements = Array.from(
        fieldElement.querySelectorAll('a')
      ) as HTMLAnchorElement[];
      appendButtonsToAnchors(field, anchorElements);
    }
  }

  return event;
});
