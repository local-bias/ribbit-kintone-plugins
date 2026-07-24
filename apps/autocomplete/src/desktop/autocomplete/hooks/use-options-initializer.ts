import { useAtomValue, useSetAtom } from '@repo/jotai';
import { useEffect } from 'react';
import { loadAutocompleteOptions } from '@/desktop/cache-control/loader';
import { isProd } from '@/lib/global';
import { getAutocompleteOptions } from '@/lib/plugin';
import { autoCompleteOptionsAtom, pluginConditionAtom } from '../states';

export const useOptionsInitializer = () => {
  const condition = useAtomValue(pluginConditionAtom);
  // Write-only: this effect must not read back what it writes, otherwise its
  // own setOptions call changes a dependency and re-triggers the effect,
  // duplicating the getAllRecordsWithId request on every mount.
  const setOptions = useSetAtom(autoCompleteOptionsAtom);

  useEffect(() => {
    if (!condition) {
      !isProd && console.warn('condition is not set');
      return;
    }

    let cancelled = false;

    void loadAutocompleteOptions({
      condition,
      onValues: (values) => {
        if (cancelled) {
          return;
        }
        setOptions(getAutocompleteOptions(values));
      },
    }).catch((error) => {
      !isProd && console.error('オプションの取得に失敗しました', error);
    });

    return () => {
      cancelled = true;
    };
  }, [condition, setOptions]);

  return null;
};
