import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { loadingOverlay } from '@/lib/loading';
import { PluginCondition } from '@/schema/plugin-config';
import {
  getAllRecords,
  getAppId,
  getQueryCondition,
  updateAllRecords,
  UpdateAllRecordsParams,
} from '@konomi-app/kintone-utilities';
import { DateTime } from 'luxon';
import Swal from 'sweetalert2';
import { getAdjustedDate, validateRecord } from '../common-actions';

export const useBulkUpdate = (params: { condition: PluginCondition }) => {
  const { condition } = params;

  return async () => {
    const input = await Swal.fire({
      icon: 'warning',
      title: t('desktop.bulkUpdate.dialog.title'),
      text: t('desktop.bulkUpdate.dialog.description'),
      showCancelButton: true,
    });

    if (!input.isConfirmed) {
      return;
    }

    try {
      loadingOverlay.label = t('desktop.bulkUpdate.loading.label.get');
      loadingOverlay.show();

      const queryCondition = getQueryCondition() ?? '';

      const targetRecords = await getAllRecords({
        app: getAppId()!,
        query: queryCondition,
        guestSpaceId: GUEST_SPACE_ID,
        debug: process.env.NODE_ENV === 'development',
      });

      loadingOverlay.label = t('desktop.bulkUpdate.loading.label.update');
      const recordsToUpdate: UpdateAllRecordsParams['records'] = [];

      for (const record of targetRecords) {
        const targetField = record[condition.targetFieldCode];
        const basisField = record[condition.basisFieldCode];
        const targetFieldType = targetField?.type;

        const validationResult = validateRecord({ record, condition });

        if (!validationResult.valid) {
          console.warn(validationResult.errorMessage);
          continue;
        }

        const basisDate =
          condition.basisType === 'currentDate'
            ? DateTime.local()
            : DateTime.fromISO(basisField!.value as string);

        const ajustedDate = getAdjustedDate({ basisDate, record, condition });

        const value =
          targetFieldType === 'DATE' ? ajustedDate.toFormat('yyyy-MM-dd') : ajustedDate.toISO();

        recordsToUpdate.push({
          id: record.$id!.value as string,
          record: { [condition.targetFieldCode]: { value } },
        });
      }

      if (recordsToUpdate.length > 0) {
        await updateAllRecords({
          app: getAppId()!,
          records: recordsToUpdate,
          guestSpaceId: GUEST_SPACE_ID,
          debug: process.env.NODE_ENV === 'development',
        });
        await Swal.fire({
          icon: 'success',
          title: t('desktop.bulkUpdate.success.dialog.title'),
          text: `${recordsToUpdate.length}${t('desktop.bulkUpdate.success.dialog.description')}`,
        });
      } else {
        await Swal.fire({
          icon: 'info',
          title: t('desktop.bulkUpdate.notFound.dialog.title'),
          text: t('desktop.bulkUpdate.notFound.dialog.description'),
        });
      }
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: t('desktop.bulkUpdate.error.dialog.title'),
        text: t('desktop.bulkUpdate.error.dialog.description'),
      });
    } finally {
      loadingOverlay.hide();
    }
  };
};
