import { onFileLoad, storePluginConfig } from '@konomi-app/kintone-utilities';
import { toast } from '@konomi-app/ui';
import { handleLoadingEndAtom, handleLoadingStartAtom, usePluginAtoms } from '@repo/jotai';
import { saveAsJson } from '@repo/utils';
import { atom, type WritableAtom } from 'jotai';
import type { ChangeEvent, ReactNode } from 'react';
import invariant from 'tiny-invariant';
import { PLUGIN_NAME } from '@/lib/constants';
import { t } from '@/lib/i18n';
import {
  createConfig,
  getNewRelatedQueryCondition,
  migrateConfig,
  restorePluginConfig,
} from '@/lib/plugin';
import type { PluginCondition, PluginConfig } from '@/schema/plugin-config';

const { config: initialConfig } = restorePluginConfig();

export const pluginConfigAtom = atom<PluginConfig>(initialConfig);

export const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  toast.success(t('common.config.toast.reset'));
});

export const {
  pluginConditionsAtom,
  hasMultipleConditionsAtom,
  conditionsLengthAtom,
  selectedConditionIdAtom,
  selectedConditionAtom,
  getConditionPropertyAtom,
  isConditionIdUnselectedAtom,
} = usePluginAtoms(pluginConfigAtom, {
  enableCommonCondition: false,
});

export const targetSpaceIdAtom = getConditionPropertyAtom('targetSpaceId');
export const relatedAppIdAtom = getConditionPropertyAtom('relatedAppId');
export const currentAppFieldCodeAtom = getConditionPropertyAtom('currentAppFieldCode');
export const relatedAppFieldCodeAtom = getConditionPropertyAtom('relatedAppFieldCode');
export const relatedQueryConditionsAtom = getConditionPropertyAtom('relatedQueryConditions');
export const relatedSubtableCodeAtom = getConditionPropertyAtom('relatedSubtableCode');
export const relatedRecordFieldCodesAtom = getConditionPropertyAtom('relatedRecordFieldCodes');
export const subtableFieldCodesAtom = getConditionPropertyAtom('subtableFieldCodes');
export const mergeRelatedRecordFieldsAtom = getConditionPropertyAtom('mergeRelatedRecordFields');
export const filterSubtableRowsByMatchingFieldAtom = getConditionPropertyAtom(
  'filterSubtableRowsByMatchingField'
);
export const showFieldAggregationsAtom = getConditionPropertyAtom('showFieldAggregations');
export const recordsPerPageAtom = getConditionPropertyAtom('recordsPerPage');
export const aggregationRoundingModeAtom = getConditionPropertyAtom('aggregationRoundingMode');
export const aggregationDecimalDigitsAtom = getConditionPropertyAtom('aggregationDecimalDigits');
export const relatedFilterConditionsAtom = getConditionPropertyAtom('relatedFilterConditions');
export const sortFieldCodeAtom = getConditionPropertyAtom('sortFieldCode');
export const sortOrderAtom = getConditionPropertyAtom('sortOrder');

const writableSelectedConditionIdAtom = selectedConditionIdAtom as WritableAtom<
  string | null,
  [string | null],
  void
>;

const updateFirstRelatedQueryCondition = (
  condition: PluginCondition,
  relatedAppFieldCode: string
): PluginCondition['relatedQueryConditions'] => {
  const [firstCondition, ...restConditions] = condition.relatedQueryConditions;
  if (!firstCondition) {
    return [
      {
        ...getNewRelatedQueryCondition(),
        currentAppFieldCode: condition.currentAppFieldCode,
        relatedAppFieldCode,
      },
    ];
  }

  return [
    {
      ...firstCondition,
      currentAppFieldCode: firstCondition.currentAppFieldCode || condition.currentAppFieldCode,
      relatedAppFieldCode,
    },
    ...restConditions,
  ];
};

export const handleRelatedAppChangeAtom = atom(null, (get, set, relatedAppId: string) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConfigAtom, (prev) => ({
    ...prev,
    conditions: prev.conditions.map((condition) =>
      condition.id === selectedConditionId
        ? {
            ...condition,
            relatedAppId,
            relatedAppFieldCode: '',
            relatedQueryConditions: [getNewRelatedQueryCondition()],
            relatedSubtableCode: '',
            relatedRecordFieldCodes: [],
            subtableFieldCodes: [],
            filterSubtableRowsByMatchingField: false,
            sortFieldCode: '$id',
          }
        : condition
    ),
  }));
});

export const handleRelatedAppFieldChangeAtom = atom(null, (get, set, fieldCode: string) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConfigAtom, (prev) => ({
    ...prev,
    conditions: prev.conditions.map((condition) =>
      condition.id === selectedConditionId
        ? {
            ...condition,
            relatedAppFieldCode: fieldCode,
            relatedQueryConditions: updateFirstRelatedQueryCondition(condition, fieldCode),
            filterSubtableRowsByMatchingField: false,
          }
        : condition
    ),
  }));
});

export const handleRelatedSubtableChangeAtom = atom(null, (get, set, subtableCode: string) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConfigAtom, (prev) => ({
    ...prev,
    conditions: prev.conditions.map((condition) =>
      condition.id === selectedConditionId
        ? { ...condition, relatedSubtableCode: subtableCode, subtableFieldCodes: [] }
        : condition
    ),
  }));
});

export const handlePluginConditionDeleteAtom = atom(null, (get, set) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConfigAtom, (prev) => ({
    ...prev,
    conditions: prev.conditions.filter((condition) => condition.id !== selectedConditionId),
  }));
  set(writableSelectedConditionIdAtom, null);
  toast.success(t('common.config.toast.onConditionDelete'));
});

export const updatePluginConfig = atom(null, (get, set, _actionComponent?: ReactNode) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    storePluginConfig(pluginConfig, {
      flatProperties: ['conditions'],
      debug: true,
    });
    toast.success(t('common.config.toast.save'));
  } finally {
    set(handleLoadingEndAtom);
  }
});

/**
 * jsonファイルを読み込み、プラグインの設定情報をインポートします
 */
export const importPluginConfigAtom = atom(
  null,
  async (_, set, event: ChangeEvent<HTMLInputElement>) => {
    try {
      set(handleLoadingStartAtom);
      const { files } = event.target;
      invariant(files?.length, 'ファイルが見つかりませんでした');
      const file = files[0];
      invariant(file, 'ファイルが見つかりませんでした');
      const fileEvent = await onFileLoad(file);
      const text = (fileEvent.target?.result ?? '') as string;
      set(pluginConfigAtom, migrateConfig(JSON.parse(text)));
      toast.success(t('common.config.toast.import'));
    } catch (error) {
      toast.error(t('common.config.error.import'));
      throw error;
    } finally {
      set(handleLoadingEndAtom);
    }
  }
);

/**
 * プラグインの設定情報をjsonファイルとしてエクスポートします
 */
export const exportPluginConfigAtom = atom(null, (get, set) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    saveAsJson(pluginConfig, `${PLUGIN_NAME}-config.json`);
    toast.success(t('common.config.toast.export'));
  } catch (error) {
    toast.error(t('common.config.error.export'));
    throw error;
  } finally {
    set(handleLoadingEndAtom);
  }
});
