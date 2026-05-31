import { restorePluginConfig } from '@/lib/plugin';
import { usePluginAtoms } from '@/lib/w-plugin';
import { PluginConfig } from '@/schema/plugin-config';
import { atom, PrimitiveAtom, WritableAtom } from 'jotai';

const { config: initialConfig, error: configError } = restorePluginConfig();

export const pluginConfigAtom = atom<PluginConfig>(initialConfig);

/**
 * プラグイン設定の読み込み時に発生したエラーを保持するatom
 * エラーがない場合はnull
 */
export const configErrorAtom = atom<Error | null>(configError ?? null);

export const loadingState = atom<boolean>(false);

export const selectedConditionIdState = atom<string | null>(null);

export const {
  pluginConditionsAtom,
  selectedConditionAtom,
  hasMultipleConditionsAtom,
  selectedConditionIdAtom,
  commonConfigAtom,
  getConditionPropertyAtom,
  isConditionIdUnselectedAtom,
} = usePluginAtoms(pluginConfigAtom, {
  enableCommonCondition: true,
});

const commonPropertyStateCache = new Map<string, any>();

const commonPropertyState = <K extends keyof PluginConfig['common']>(
  key: K
): WritableAtom<PluginConfig['common'][K], [PluginConfig['common'][K]], void> => {
  if (commonPropertyStateCache.has(key)) {
    return commonPropertyStateCache.get(key)!;
  }
  const a = atom(
    (get) => get(pluginConfigAtom).common[key],
    (get, set, newValue: PluginConfig['common'][K]) => {
      set(pluginConfigAtom, (current) => ({
        ...current,
        common: {
          ...current.common,
          [key]: newValue,
        },
      }));
    }
  );
  commonPropertyStateCache.set(key, a as any);
  return a as WritableAtom<PluginConfig['common'][K], [PluginConfig['common'][K]], void>;
};

export const getCommonPropertyState = <T extends keyof PluginConfig['common']>(property: T) =>
  commonPropertyState(property) as PrimitiveAtom<PluginConfig['common'][T]>;

export const dstAppIdAtom = getConditionPropertyAtom('dstAppId');
export const dstSpaceIdAtom = getConditionPropertyAtom('dstSpaceId');
export const isDstAppGuestSpaceAtom = getConditionPropertyAtom('isDstAppGuestSpace');
export const srcKeyFieldCodeAtom = getConditionPropertyAtom('srcKeyFieldCode');
export const dstKeyFieldCodeAtom = getConditionPropertyAtom('dstKeyFieldCode');
export const bindingsAtom = getConditionPropertyAtom('bindings');
export const srcQueryAtom = getConditionPropertyAtom('srcQuery');
export const dstQueryAtom = getConditionPropertyAtom('dstQuery');
export const createIfNotExistsAtom = getConditionPropertyAtom('createIfNotExists');
export const srcConditionsAtom = getConditionPropertyAtom('srcConditions');
export const triggerEventsAtom = getConditionPropertyAtom('triggerEvents');
export const processActionsAtom = getConditionPropertyAtom('processActions');
export const processStatusesAtom = getConditionPropertyAtom('processStatuses');
export const deleteRelatedRecordsAtom = getConditionPropertyAtom('deleteRelatedRecords');
