import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { evaluateCondition } from '@konomi-app/kintone-utilities-react';
import type { PluginCondition, TargetScreen } from '@/schema/plugin-config';

/** タブの表示可否を判定するために必要な、画面側の状態 */
export type TabVisibilityContext = {
  /** 現在表示している画面 */
  screen: TargetScreen;
  /** 現在のレコード。取得できていない場合は`null` */
  record: kintoneAPI.RecordData | null;
  /**
   * 閲覧者の情報。取得できていない場合は`null`
   *
   * `null`の場合、閲覧者による絞り込みは行いません(表示側に倒します)。
   * このプラグインはフィールドの見た目を切り替えるだけで、
   * アクセス制御の手段ではないためです。
   */
  viewer: { code: string; groups: string[]; organizations: string[] } | null;
  /** プロセス管理の現在のステータス。プロセス管理が無効な場合は`null` */
  status: string | null;
};

/** 画面種別の条件を満たすかどうか */
const matchesScreen = (condition: PluginCondition, screen: TargetScreen): boolean =>
  condition.targetScreens.includes(screen);

/** レコードの値による条件を満たすかどうか */
const matchesRecord = (
  condition: PluginCondition,
  record: kintoneAPI.RecordData | null
): boolean => {
  const { displayConditions, displayConditionLogic } = condition;
  if (displayConditions.length === 0) {
    return true;
  }
  if (!record) {
    return true;
  }
  return displayConditionLogic === 'or'
    ? displayConditions.some((target) => evaluateCondition(target, record))
    : displayConditions.every((target) => evaluateCondition(target, record));
};

/** 閲覧者による条件を満たすかどうか */
const matchesViewer = (
  condition: PluginCondition,
  viewer: TabVisibilityContext['viewer']
): boolean => {
  const { viewerUsers, viewerGroups, viewerOrganizations } = condition;
  if (viewerUsers.length === 0 && viewerGroups.length === 0 && viewerOrganizations.length === 0) {
    return true;
  }
  if (!viewer) {
    return true;
  }
  return (
    viewerUsers.includes(viewer.code) ||
    viewerGroups.some((group) => viewer.groups.includes(group)) ||
    viewerOrganizations.some((organization) => viewer.organizations.includes(organization))
  );
};

/** プロセス管理のステータスによる条件を満たすかどうか */
const matchesStatus = (condition: PluginCondition, status: string | null): boolean => {
  if (condition.statuses.length === 0) {
    return true;
  }
  if (status === null) {
    return true;
  }
  return condition.statuses.includes(status);
};

/**
 * 設定されたタブを、現在の画面状態で表示すべきかどうかを判定します
 *
 * 各条件は「設定が空なら絞り込まない」「判定材料が揃っていなければ表示する」という
 * 方針で評価します。タブが消えて操作できなくなる事故を避けるためです。
 *
 * @param condition タブの設定情報
 * @param context 画面側の状態
 * @returns タブを表示する場合は`true`
 */
export const isTabVisible = (
  condition: PluginCondition,
  context: TabVisibilityContext
): boolean => {
  const { screen, record, viewer, status } = context;
  return (
    matchesScreen(condition, screen) &&
    matchesRecord(condition, record) &&
    matchesViewer(condition, viewer) &&
    matchesStatus(condition, status)
  );
};

/**
 * `displayConditions`が参照しているフィールドコードの一覧を返します
 *
 * 値の変更を監視して表示条件を再評価するために使用します
 */
export const getWatchedFieldCodes = (conditions: PluginCondition[]): string[] => {
  const codes = conditions.flatMap((condition) =>
    condition.displayConditions.map((target) => target.subtableCode || target.fieldCode)
  );
  return [...new Set(codes.filter((code) => code !== ''))];
};
