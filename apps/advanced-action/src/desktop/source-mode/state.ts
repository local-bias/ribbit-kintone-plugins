import { QUERY_PARAM_KEY } from '@/lib/constants';
import { isDev } from '@/lib/global';
import { appFormFieldsAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { compressToEncodedURIComponent } from 'lz-string';
import invariant from 'tiny-invariant';
import { pluginConditionsAtom } from '../public-state';
import { createUrlParams } from './actions';
import { getCurrentRecord } from '@konomi-app/kintone-utilities';

const conditionAtom = atomFamily((id: string) =>
  atom((get) => {
    const condition = get(pluginConditionsAtom).find((c) => c.id === id);
    invariant(condition, 'Condition not found');
    return condition;
  })
);

export const destinationUrlAtom = atomFamily(
  (params: { conditionId: string; recordId: string; revision: string }) =>
    atom(async (get) => {
      const { conditionId } = params;
      const { record: currentRecord } = getCurrentRecord();
      if (!currentRecord) {
        return '';
      }
      const condition = get(conditionAtom(conditionId));

      const dstAppFields = await get(
        appFormFieldsAtom({
          app: condition.dstAppId,
          guestSpaceId: condition.dstGuestSpaceId,
          debug: isDev,
        })
      );
      const urlParams = await createUrlParams({
        condition,
        dstAppFields: dstAppFields,
        currentRecord,
      });

      const url = new URL(window.location.origin);
      const { dstAppId, dstGuestSpaceId } = condition;
      url.pathname = `/k/${dstGuestSpaceId ? `guest/${dstGuestSpaceId}/` : ''}${dstAppId}/edit`;
      url.searchParams.set(
        QUERY_PARAM_KEY,
        compressToEncodedURIComponent(JSON.stringify(urlParams))
      );

      isDev && console.log('Destination URL:', url.toString());

      return url.toString();
    }),
  (a, b) =>
    a.conditionId === b.conditionId && a.recordId === b.recordId && a.revision === b.revision
);
