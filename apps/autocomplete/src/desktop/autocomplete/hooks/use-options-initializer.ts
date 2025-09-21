import { useRecoilState, useRecoilValue } from 'recoil';
import { autoCompleteOptionsState, cachedOptionsState, pluginConditionState } from '../states';
import { useEffect } from 'react';
import { getAllRecordsWithId } from '@konomi-app/kintone-utilities';
import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { GUEST_SPACE_ID } from '@/lib/global';
import { getAutocompleteOptions, getAutocompleteValues } from '@/lib/plugin';

export const useOptionsInitializer = () => {
  const condition = useRecoilValue(pluginConditionState);
  const [options, setOptions] = useRecoilState(autoCompleteOptionsState);
  const cachedOptions = useRecoilValue(cachedOptionsState);

  useEffect(() => {
    if (!condition) {
      process.env.NODE_ENV === 'development' && console.warn('condition is not set');
      return;
    }
    if (cachedOptions.length > 0 && !options.length) {
      process.env.NODE_ENV === 'development' &&
        console.info('キャッシュが存在するため、キャッシュを利用します');
      setOptions(getAutocompleteOptions(cachedOptions));
    }
    (async () => {
      const { srcAppId, srcFieldCode } = condition;
      const allRecords = await getAllRecordsWithId({
        app: srcAppId,
        fields: [srcFieldCode],
        guestSpaceId: GUEST_SPACE_ID,
        debug: process.env.NODE_ENV === 'development',
        onStep: ({ records }) => {
          if (cachedOptions.length) {
            return;
          }
          const values = getAutocompleteValues({ records, srcFieldCode });
          setOptions(getAutocompleteOptions(values));
        },
      });
      const allValues = getAutocompleteValues({ records: allRecords, srcFieldCode });

      process.env.NODE_ENV === 'development' &&
        console.log('最新のオプションを取得しました', { allRecords, allValues });

      setOptions(getAutocompleteOptions(allValues));
      const localStorageItem = localStorage.getItem(LOCAL_STORAGE_KEY) || '{}';
      const cache = {
        ...JSON.parse(localStorageItem),
        version: 1,
        [condition.cacheId]: allValues,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cache));
      process.env.NODE_ENV === 'development' && console.info('キャッシュを更新しました');
    })();
  }, [condition, cachedOptions]);

  return null;
};
