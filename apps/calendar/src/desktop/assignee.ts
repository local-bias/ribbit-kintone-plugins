/**
 * 予定の担当者(任意のフィールドの値)による絞り込みのための純粋関数群
 *
 * 担当者はカテゴリーとは別の軸として扱い、サイドバーでカテゴリーと組み合わせて絞り込む。
 * kintoneのグローバル変数に依存しないようにしておき、単体テストできるようにしている
 */

/** 担当者が設定されていない予定を表す絞り込み用のキー(kintoneの値と衝突しないよう制御文字を含める) */
export const UNASSIGNED_KEY = '\u0000unassigned';

export type Assignee = {
  /** 絞り込みに使用するキー(ユーザー・組織・グループはコード、それ以外は値) */
  key: string;
  /** 表示名 */
  label: string;
  /** cybozu.comのユーザーかどうか(アバターを表示する) */
  isUser: boolean;
};

/**
 * 担当者による絞り込みの条件
 *
 * 担当者の一覧は読み込んだ予定から動的に増減するため、通常は「非表示にした担当者」を持ち、
 * 後から現れた担当者は表示される。「のみ表示」を選んだ場合だけ「表示する担当者」を持つ
 */
export type AssigneeFilter = { mode: 'hidden'; keys: string[] } | { mode: 'only'; keys: string[] };

type FieldLike = { type: string; value: unknown } | undefined;
type EntityValue = { code?: unknown; name?: unknown };

/** 値がユーザーを表すフィールドタイプ */
const USER_FIELD_TYPES = ['USER_SELECT', 'CREATOR', 'MODIFIER', 'STATUS_ASSIGNEE'];
/** 値がコードと名前を持つ(ユーザー・組織・グループの)フィールドタイプ */
const ENTITY_FIELD_TYPES = [...USER_FIELD_TYPES, 'ORGANIZATION_SELECT', 'GROUP_SELECT'];

const toEntityAssignee = (value: EntityValue, isUser: boolean): Assignee | null => {
  if (typeof value?.code !== 'string' || !value.code) {
    return null;
  }
  const name = typeof value.name === 'string' && value.name ? value.name : value.code;
  return { key: value.code, label: name, isUser };
};

const toTextAssignee = (value: unknown): Assignee | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const text = String(value);
  return text ? { key: text, label: text, isUser: false } : null;
};

/** キーの重複を除きます(担当者の数が多い場合に備え、Mapで線形時間にする) */
const uniqueByKey = (assignees: Assignee[]): Assignee[] => [
  ...new Map(assignees.map((assignee) => [assignee.key, assignee] as const)).values(),
];

/** レコードのフィールドから、予定の担当者の一覧を取り出します */
export const extractAssignees = (field: FieldLike): Assignee[] => {
  if (!field || field.value == null) {
    return [];
  }
  const { type, value } = field;
  const values = Array.isArray(value) ? value : [value];
  const isUser = USER_FIELD_TYPES.includes(type);

  const assignees = ENTITY_FIELD_TYPES.includes(type)
    ? values.map((item) => toEntityAssignee(item as EntityValue, isUser))
    : values.map(toTextAssignee);

  return uniqueByKey(assignees.filter((assignee): assignee is Assignee => assignee !== null));
};

/**
 * 絞り込みの対象となる予定
 *
 * `assignees`が`undefined`の予定は、担当者をまだ取得していない予定(保存前の下書きや、保存直後で
 * kintoneが決める値を再取得する前の予定)を表し、`[]`(担当者なし)とは区別する
 */
type AssigneeFilterTarget = { assignees?: Assignee[]; display?: string };

/**
 * 担当者で絞り込まない予定かどうか
 *
 * - 担当者をまだ取得していない予定は、操作中に消えたように見えないよう常に表示する
 * - 祝日などの背景イベントは担当者を持たないことが多く、絞り込みで消えると不便なため常に表示する
 */
const isExemptFromAssigneeFilter = (event: AssigneeFilterTarget) =>
  event.assignees === undefined || (event.display === 'background' && !event.assignees.length);

/** 読み込んだ予定から、サイドバーに表示する担当者の一覧を組み立てます */
export const buildAssigneeOptions = (
  events: AssigneeFilterTarget[]
): { assignees: Assignee[]; hasUnassigned: boolean } => {
  const all = uniqueByKey(events.flatMap((event) => event.assignees ?? []));
  const assignees = [...all].sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  const hasUnassigned = events.some(
    (event) => !isExemptFromAssigneeFilter(event) && !event.assignees?.length
  );
  return { assignees, hasUnassigned };
};

/** 担当者(または`UNASSIGNED_KEY`)を表示する条件かどうかを返します */
export const isAssigneeKeyShown = (key: string, filter: AssigneeFilter | null): boolean => {
  if (filter === null) {
    return true;
  }
  return filter.mode === 'only' ? filter.keys.includes(key) : !filter.keys.includes(key);
};

/**
 * 担当者の表示・非表示を切り替えた後の絞り込み条件を返します
 *
 * すべて表示する状態に戻った場合は`null`(絞り込みなし)を返します
 */
export const toggleAssigneeFilter = (
  filter: AssigneeFilter | null,
  key: string
): AssigneeFilter | null => {
  const current = filter ?? { mode: 'hidden', keys: [] };
  const keys = current.keys.includes(key)
    ? current.keys.filter((item) => item !== key)
    : [...current.keys, key];
  if (current.mode === 'hidden' && keys.length === 0) {
    return null;
  }
  return { mode: current.mode, keys };
};

/**
 * 担当者の絞り込み条件で、予定を表示するかどうかを判定します
 *
 * 複数の担当者を持つ予定は、いずれかの担当者が表示される条件なら表示します
 */
export const isShownForAssignees = (
  event: AssigneeFilterTarget,
  filter: AssigneeFilter | null
): boolean => {
  if (filter === null || isExemptFromAssigneeFilter(event)) {
    return true;
  }
  if (!event.assignees?.length) {
    return isAssigneeKeyShown(UNASSIGNED_KEY, filter);
  }
  return event.assignees.some(({ key }) => isAssigneeKeyShown(key, filter));
};
