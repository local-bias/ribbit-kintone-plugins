/**
 * サイドバーの絞り込み(カテゴリー・担当者・キーワード検索)の判定を行う純粋関数群
 *
 * カレンダーへの表示と、保存した予定が絞り込みで非表示になるかの判定の両方で同じ規則を使う。
 * kintoneのグローバル変数に依存しないようにしておき、単体テストできるようにしている
 */
import { type Assignee, type AssigneeFilter, isShownForAssignees } from './assignee';

export type CalendarFilters = {
  /** 表示するカテゴリー(`null`の場合は絞り込まない) */
  categories: readonly string[] | null;
  /** 担当者による絞り込みの条件(`null`の場合は絞り込まない) */
  assignees: AssigneeFilter | null;
  /** 正規化済みの検索語(すべてを含む予定を表示する。空の場合は絞り込まない) */
  searchWords: readonly string[];
};

type FilterTarget = {
  category?: unknown;
  assignees?: Assignee[];
  display?: string;
  __quickSearch?: string;
};

/** カテゴリーの絞り込みで表示するかどうか(カテゴリーの無い予定は常に表示する) */
export const isShownForCategories = (
  event: FilterTarget,
  categories: readonly string[] | null
): boolean =>
  categories === null || !event.category || categories.includes(event.category as string);

/** キーワード検索の条件を満たすかどうか */
export const matchesSearchWords = (event: FilterTarget, searchWords: readonly string[]): boolean =>
  searchWords.every((word) => !!event.__quickSearch && event.__quickSearch.includes(word));

/** すべての絞り込みの条件を満たすかどうか */
export const isShownUnderFilters = (event: FilterTarget, filters: CalendarFilters): boolean =>
  isShownForCategories(event, filters.categories) &&
  isShownForAssignees(event, filters.assignees) &&
  matchesSearchWords(event, filters.searchWords);

/** いずれかの絞り込みが行われているかどうか */
export const hasActiveFilters = (filters: CalendarFilters): boolean =>
  filters.categories !== null || filters.assignees !== null || filters.searchWords.length > 0;
