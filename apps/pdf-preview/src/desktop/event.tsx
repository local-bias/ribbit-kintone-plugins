import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import {
  getFieldElement,
  getQuery,
  getRecords,
  isMobile,
  kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { currentAppIdAtom, store } from '@repo/jotai';
import config from 'plugin.config.mjs';
import { clone, entries } from 'remeda';
import { createPreviewButton } from './actions';
import App from './components';
import { fileFieldsWithPDFAtom, targetRecordAtom } from './public-state';

const componentManager = ComponentManager.getInstance();
componentManager.debug = isDev;

componentManager.renderComponent({
  id: `🐸${config.id}-root`,
  component: <App />,
  parentElement: document.body,
});

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

    const fileFields = (
      entries(record).filter(([, field]) => field.type === 'FILE') as [
        key: string,
        value: kintoneAPI.field.File,
      ][]
    ).map(([code, { type, value }]) => ({ code, type, value }));

    const filter = (file: kintoneAPI.field.File['value'][number]) =>
      file.contentType === 'application/pdf';

    const pdfFields = fileFields
      .filter((field) => field.value.some(filter))
      .map((field) => ({ code: field.code, type: field.type, value: field.value.filter(filter) }));

    for (const _field of pdfFields) {
      const field = clone(_field);
      const listItems = Array.from(row.querySelectorAll('li'));

      for (const listItem of listItems) {
        const anchorElement = listItem.querySelector('a');
        const anchorText = anchorElement?.textContent;
        if (!anchorText) continue;

        const targetFileIndex = field.value.findIndex((file) => file.name === anchorText);
        if (targetFileIndex === -1) continue;

        listItem.append(createPreviewButton(field.value[targetFileIndex]!.fileKey));
        field.value = field.value.toSpliced(targetFileIndex, 1);
      }
    }
  });

  return event;
});

manager.add(['app.record.detail.show', 'app.record.edit.show'], async (event) => {
  store.set(targetRecordAtom, event.record);

  for (const _field of store.get(fileFieldsWithPDFAtom)) {
    const field = clone(_field);
    const fieldElement = getFieldElement(field.code);
    if (!fieldElement) continue;
    if (!isMobile()) {
      const listItems = Array.from(fieldElement?.querySelectorAll('li'));

      for (const listItem of listItems) {
        const anchorElement = listItem.querySelector('a');
        const anchorText = anchorElement?.textContent;
        if (!anchorText) continue;

        const targetFileIndex = field.value.findIndex((file) => file.name === anchorText);
        if (targetFileIndex === -1) continue;

        listItem.append(createPreviewButton(field.value[targetFileIndex]!.fileKey));
        field.value = field.value.toSpliced(targetFileIndex, 1);
      }
    } else {
      const anchorElements = Array.from(fieldElement?.querySelectorAll('a'));

      for (const anchorElement of anchorElements) {
        const anchorText = anchorElement.textContent;
        if (!anchorText) continue;

        const targetFileIndex = field.value.findIndex((file) => file.name === anchorText);
        if (targetFileIndex === -1) continue;

        anchorElement.append(createPreviewButton(field.value[targetFileIndex]!.fileKey));
        field.value = field.value.toSpliced(targetFileIndex, 1);
      }
    }
  }

  return event;
});
