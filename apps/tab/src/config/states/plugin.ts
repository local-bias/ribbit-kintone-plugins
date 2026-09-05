import { createPluginConfigStore } from '@repo/plugin/react';
import { PLUGIN_NAME } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { createConfig, migrateConfig, restorePluginConfig } from '@/lib/plugin';
import type { AnyPluginConfig, PluginConfig } from '@/schema/plugin-config';

export const {
  pluginConfigAtom,
  handlePluginConfigResetAtom,
  handlePluginConditionDeleteAtom,
  updatePluginConfig,
  importPluginConfigAtom,
  exportPluginConfigAtom,
  pluginConditionsAtom,
  hasMultipleConditionsAtom,
  conditionsLengthAtom,
  selectedConditionIdAtom,
  selectedConditionAtom,
  getConditionPropertyAtom,
  commonConfigAtom,
  isConditionIdUnselectedAtom,
  getCommonPropertyAtom,
} = createPluginConfigStore<PluginConfig, AnyPluginConfig>({
  restorePluginConfig,
  createConfig,
  migrateConfig,
  t,
  pluginName: PLUGIN_NAME,
});

/** 共通設定: 全てのタブに適用される幅(px) */
export const tabWidthAtom = getCommonPropertyAtom('tabWidth');

/** 共通設定: 最後に選択していたタブを記憶するかどうか */
export const remembersSelectedTabAtom = getCommonPropertyAtom('remembersSelectedTab');

/** 共通設定: 未入力の必須フィールドをタブに表示するかどうか */
export const notifiesMissingRequiredFieldsAtom = getCommonPropertyAtom(
  'notifiesMissingRequiredFields'
);

/** 共通設定: フォームへ後から追加された要素を、既存のタブでどう扱うか */
export const newElementPolicyAtom = getCommonPropertyAtom('newElementPolicy');

/** 共通設定: 表示できる要素が無くなった行を、行ごと畳むかどうか */
export const collapsesEmptyRowsAtom = getCommonPropertyAtom('collapsesEmptyRows');

export const tabNameAtom = getConditionPropertyAtom('tabName');
export const fieldDisplayModeAtom = getConditionPropertyAtom('fieldDisplayMode');
export const fieldsAtom = getConditionPropertyAtom('fields');
export const groupDisplayModeAtom = getConditionPropertyAtom('groupDisplayMode');
export const groupsAtom = getConditionPropertyAtom('groups');
export const labelDisplayModeAtom = getConditionPropertyAtom('labelDisplayMode');
export const labelsAtom = getConditionPropertyAtom('labels');
export const spaceDisplayModeAtom = getConditionPropertyAtom('spaceDisplayMode');
export const spaceIdsAtom = getConditionPropertyAtom('spaceIds');
export const hrDisplayModeAtom = getConditionPropertyAtom('hrDisplayMode');
export const hrsAtom = getConditionPropertyAtom('hrs');
export const targetScreensAtom = getConditionPropertyAtom('targetScreens');
export const displayConditionsAtom = getConditionPropertyAtom('displayConditions');
export const displayConditionLogicAtom = getConditionPropertyAtom('displayConditionLogic');
export const viewerUsersAtom = getConditionPropertyAtom('viewerUsers');
export const viewerGroupsAtom = getConditionPropertyAtom('viewerGroups');
export const viewerOrganizationsAtom = getConditionPropertyAtom('viewerOrganizations');
export const statusesAtom = getConditionPropertyAtom('statuses');
