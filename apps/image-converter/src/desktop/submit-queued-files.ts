import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import { store } from '@/lib/store';
import { kintoneAPI, updateRecord } from '@konomi-app/kintone-utilities';
import { currentAppIdAtom } from '@repo/jotai';
import { queuedFilesAtom } from './states';

manager.add(
  ['app.record.create.submit.success', 'app.record.edit.submit.success'],
  async (event) => {
    const files = store.get(queuedFilesAtom);
    if (!Object.keys(files).length) {
      return event;
    }

    try {
      const app = store.get(currentAppIdAtom);
      const { record } = event;

      const newRecord = Object.fromEntries(
        Object.entries(files)
          .filter(([fieldCode]) => {
            const field = record[fieldCode];
            return field && field.type === 'FILE';
          })
          .map(([fieldCode, file]) => [
            fieldCode,
            {
              value: [
                ...((record[fieldCode]?.value as kintoneAPI.field.File['value']) ?? []),
                ...(file as kintoneAPI.field.File['value']),
              ],
            },
          ])
      );

      await updateRecord({
        app,
        id: event.recordId,
        record: newRecord,
        guestSpaceId: GUEST_SPACE_ID,
        debug: !isProd,
      });
    } finally {
      store.set(queuedFilesAtom, {});
    }

    return event;
  }
);
