import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { DisplayMode, NewElementPolicy, PluginCondition } from '@/schema/plugin-config';
import { getLabelText } from './kintone';
import { shouldShowKey } from './visibility';

/** 一括編集で割り当ての対象となる要素の種別 */
export type BulkEditElementType = 'field' | 'group' | 'space' | 'label' | 'hr';

/** タブへ割り当てられる、フォーム上の要素 */
export type BulkEditElementRow = {
  kind: 'element';
  /** 行を一意に識別するキー。同じ要素が複数箇所に現れても重複しません */
  id: string;
  /**
   * 割り当ての単位となるキー
   *
   * ラベルのように同じ値が複数箇所に現れる要素では、複数の行が同じキーを共有します
   */
  assignmentKey: string;
  type: BulkEditElementType;
  /** 設定情報へ保存する値(フィールドコード・要素ID・ラベルの文言) */
  key: string;
  /** 設定画面に表示する名称 */
  name: string;
  /** グループフィールドの内側にあるかどうか */
  nested: boolean;
  /** 同じ`assignmentKey`を持つ行が他にも存在するかどうか */
  duplicated: boolean;
};

/**
 * タブへ割り当てられない、フォームの構造を示すためだけの行
 *
 * いずれも要素IDが設定されていないため、操作画面で個別に特定できない要素です。
 * アプリのフォーム設定で要素IDを設定すると、割り当ての対象になります。
 *
 * - `anonymousSpace`: 要素IDが未設定のスペース
 * - `anonymousLabel`: 要素IDが未設定で、かつ文言も空のラベル
 * - `anonymousHr`: 要素IDが未設定の罫線
 */
export type BulkEditMarkerRow = {
  kind: 'anonymousSpace' | 'anonymousLabel' | 'anonymousHr';
  id: string;
  nested: boolean;
};

/** 一括編集の1行 */
export type BulkEditRow = BulkEditElementRow | BulkEditMarkerRow;

/**
 * 要素ごとの割り当て先タブID
 *
 * キーは{@link BulkEditElementRow.assignmentKey}、値はその要素を表示するタブのIDです
 */
export type BulkEditAssignments = Record<string, string[]>;

/** 要素の種別と値から、割り当ての単位となるキーを生成します */
export const toAssignmentKey = (type: BulkEditElementType, key: string): string => `${type}:${key}`;

/** 指定した種別について、タブ設定が保持している表示方法と対象の一覧を取り出します */
const getCategoryState = (
  condition: PluginCondition,
  type: BulkEditElementType
): { mode: DisplayMode; selected: string[] } => {
  switch (type) {
    case 'field':
      return { mode: condition.fieldDisplayMode, selected: condition.fields };
    case 'group':
      return { mode: condition.groupDisplayMode, selected: condition.groups };
    case 'space':
      return { mode: condition.spaceDisplayMode, selected: condition.spaceIds };
    case 'label':
      return { mode: condition.labelDisplayMode, selected: condition.labels };
    case 'hr':
      return { mode: condition.hrDisplayMode, selected: condition.hrs };
  }
};

/**
 * フォームレイアウトを、レイアウト順に並んだ一括編集の行へ変換します
 *
 * 操作画面での表示・非表示の判定単位と揃える必要があるため、
 * サブテーブルは表そのものを1つのフィールドとして扱い、内部のフィールドは展開しません。
 *
 * @param params.layout アプリのフォームレイアウト
 * @param params.fieldProperties 表示名を解決するためのフィールド情報(グループフィールドを含む)
 * @param params.parseLabelText ラベルの文言を取り出す関数。DOMParserが使えない環境向けの差し替え用
 */
export const buildBulkEditRows = (params: {
  layout: kintoneAPI.Layout;
  fieldProperties: kintoneAPI.FieldProperty[];
  parseLabelText?: (label: string) => string;
}): BulkEditRow[] => {
  const { layout, fieldProperties, parseLabelText = getLabelText } = params;

  /** 要素IDは、kintoneの型定義に含まれていないラベル・罫線でも参照する */
  const getElementId = (field: { type: string; elementId?: string }): string =>
    field.elementId ?? '';

  const labelByCode = new Map(fieldProperties.map((field) => [field.code, field.label]));
  const rows: BulkEditRow[] = [];
  const nextId = () => `bulk-edit-row-${rows.length}`;

  const pushElement = (element: {
    type: BulkEditElementType;
    key: string;
    name: string;
    nested: boolean;
  }) => {
    rows.push({
      kind: 'element',
      id: nextId(),
      assignmentKey: toAssignmentKey(element.type, element.key),
      duplicated: false,
      ...element,
    });
  };

  const pushField = (code: string, nested: boolean) => {
    pushElement({ type: 'field', key: code, name: labelByCode.get(code) ?? code, nested });
  };

  const walkRow = (row: kintoneAPI.layout.Row, nested: boolean) => {
    for (const field of row.fields) {
      switch (field.type) {
        case 'LABEL': {
          const elementId = getElementId(field);
          const text = parseLabelText(field.label);
          // 要素IDを持つラベルは要素IDで、持たないラベルは文言で識別する
          const key = elementId || text;
          if (key === '') {
            // 要素IDも文言も無いラベルは操作画面で特定できないため、割り当ての対象外とする
            rows.push({ kind: 'anonymousLabel', id: nextId(), nested });
            break;
          }
          pushElement({ type: 'label', key, name: text || elementId, nested });
          break;
        }
        case 'HR': {
          const elementId = getElementId(field);
          if (elementId === '') {
            rows.push({ kind: 'anonymousHr', id: nextId(), nested });
            break;
          }
          pushElement({ type: 'hr', key: elementId, name: elementId, nested });
          break;
        }
        case 'SPACER': {
          if (field.elementId) {
            pushElement({
              type: 'space',
              key: field.elementId,
              name: field.elementId,
              nested,
            });
          } else {
            rows.push({ kind: 'anonymousSpace', id: nextId(), nested });
          }
          break;
        }
        default: {
          pushField(field.code, nested);
          break;
        }
      }
    }
  };

  for (const item of layout) {
    switch (item.type) {
      case 'ROW': {
        walkRow(item, false);
        break;
      }
      case 'SUBTABLE': {
        pushField(item.code, false);
        break;
      }
      case 'GROUP': {
        pushElement({
          type: 'group',
          key: item.code,
          name: labelByCode.get(item.code) ?? item.code,
          nested: false,
        });
        for (const row of item.layout) {
          walkRow(row, true);
        }
        break;
      }
    }
  }

  const occurrences = new Map<string, number>();
  for (const row of rows) {
    if (row.kind === 'element') {
      occurrences.set(row.assignmentKey, (occurrences.get(row.assignmentKey) ?? 0) + 1);
    }
  }

  return rows.map((row) =>
    row.kind === 'element' && (occurrences.get(row.assignmentKey) ?? 0) > 1
      ? { ...row, duplicated: true }
      : row
  );
};

/** 一括編集の行から、割り当ての対象となる要素だけを重複なく取り出します */
export const getUniqueElementRows = (rows: BulkEditRow[]): BulkEditElementRow[] => {
  const seen = new Set<string>();
  return rows.filter((row): row is BulkEditElementRow => {
    if (row.kind !== 'element' || seen.has(row.assignmentKey)) {
      return false;
    }
    seen.add(row.assignmentKey);
    return true;
  });
};

/**
 * 保存済みのタブ設定から、現在の割り当て状況を読み取ります
 *
 * 表示方法(`add` / `sub`)を解釈した結果を返すため、
 * タブごとの詳細設定で編集された設定情報も、そのまま一括編集に反映されます。
 */
export const readAssignments = (params: {
  rows: BulkEditRow[];
  conditions: PluginCondition[];
}): BulkEditAssignments => {
  const { rows, conditions } = params;

  const assignments: BulkEditAssignments = {};
  for (const row of getUniqueElementRows(rows)) {
    const { type, key, assignmentKey } = row;
    assignments[assignmentKey] = conditions
      .filter((condition) => {
        const { mode, selected } = getCategoryState(condition, type);
        return shouldShowKey({ displayMode: mode, selected, key });
      })
      .map((condition) => condition.id);
  }
  return assignments;
};

/** 種別ごとに、フォーム上に存在する要素のキーを取り出します */
const getKeysByType = (rows: BulkEditRow[]): Record<BulkEditElementType, string[]> => {
  const keys: Record<BulkEditElementType, string[]> = {
    field: [],
    group: [],
    space: [],
    label: [],
    hr: [],
  };
  for (const row of getUniqueElementRows(rows)) {
    keys[row.type].push(row.key);
  }
  return keys;
};

/**
 * 1つの種別について、保存する表示方法と対象の一覧を組み立てます
 *
 * フォーム上に存在しない値は、操作画面の判定対象にならず影響を持たないため、
 * アプリ側の変更で一時的に消えた要素の設定を失わないよう、そのまま残します。
 */
const resolveCategory = (params: {
  condition: PluginCondition;
  type: BulkEditElementType;
  knownKeys: string[];
  assignments: BulkEditAssignments;
  newElementPolicy: NewElementPolicy;
}): { mode: DisplayMode; values: string[] } => {
  const { condition, type, knownKeys, assignments, newElementPolicy } = params;

  const isAssigned = (key: string) =>
    (assignments[toAssignmentKey(type, key)] ?? []).includes(condition.id);
  const unknownValues = getCategoryState(condition, type).selected.filter(
    (value) => !knownKeys.includes(value)
  );

  // 後からフォームへ追加された要素を全てのタブで表示するには、
  // 「指定したものを非表示」(`sub`)として、割り当て済み以外を列挙する必要がある
  return newElementPolicy === 'show'
    ? { mode: 'sub', values: [...knownKeys.filter((key) => !isAssigned(key)), ...unknownValues] }
    : { mode: 'add', values: [...knownKeys.filter(isAssigned), ...unknownValues] };
};

/**
 * 一括編集の割り当てを、タブ設定へ書き戻します
 *
 * 割り当てられていない要素は、どちらの`newElementPolicy`でも全てのタブで非表示になります。
 * `newElementPolicy`が影響するのは、この設定を保存した後にフォームへ追加された要素の扱いだけです。
 */
export const applyAssignments = (params: {
  conditions: PluginCondition[];
  rows: BulkEditRow[];
  assignments: BulkEditAssignments;
  newElementPolicy: NewElementPolicy;
}): PluginCondition[] => {
  const { conditions, rows, assignments, newElementPolicy } = params;
  const keysByType = getKeysByType(rows);

  return conditions.map((condition) => {
    const resolve = (type: BulkEditElementType) =>
      resolveCategory({
        condition,
        type,
        knownKeys: keysByType[type],
        assignments,
        newElementPolicy,
      });

    const field = resolve('field');
    const group = resolve('group');
    const space = resolve('space');
    const label = resolve('label');
    const hr = resolve('hr');

    return {
      ...condition,
      fieldDisplayMode: field.mode,
      fields: field.values,
      groupDisplayMode: group.mode,
      groups: group.values,
      spaceDisplayMode: space.mode,
      spaceIds: space.values,
      labelDisplayMode: label.mode,
      labels: label.values,
      hrDisplayMode: hr.mode,
      hrs: hr.values,
    };
  });
};

/** 1つの要素について、指定したタブへの割り当てを切り替えます */
export const toggleAssignment = (params: {
  assignments: BulkEditAssignments;
  assignmentKey: string;
  conditionId: string;
  assigned: boolean;
}): BulkEditAssignments => {
  const { assignments, assignmentKey, conditionId, assigned } = params;
  const current = assignments[assignmentKey] ?? [];
  return {
    ...assignments,
    [assignmentKey]: assigned
      ? [...current.filter((id) => id !== conditionId), conditionId]
      : current.filter((id) => id !== conditionId),
  };
};

/** 1つのタブについて、全ての要素の割り当てをまとめて切り替えます */
export const toggleAllAssignments = (params: {
  assignments: BulkEditAssignments;
  rows: BulkEditRow[];
  conditionId: string;
  assigned: boolean;
}): BulkEditAssignments => {
  const { assignments, rows, conditionId, assigned } = params;
  return getUniqueElementRows(rows).reduce<BulkEditAssignments>(
    (acc, row) =>
      toggleAssignment({
        assignments: acc,
        assignmentKey: row.assignmentKey,
        conditionId,
        assigned,
      }),
    assignments
  );
};

/**
 * 要素IDが未設定で、タブへ割り当てられない要素の数を数えます
 *
 * これらは全てのタブで同じ扱い(`sub`なら常に表示・`add`なら常に非表示)になるため、
 * 「非表示にしたはずの場所に余白が残る」原因になります
 */
export const countAnonymousElements = (rows: BulkEditRow[]): number =>
  rows.filter((row) => row.kind !== 'element').length;

/** どのタブにも割り当てられていない要素の数を数えます */
export const countUnassignedElements = (params: {
  rows: BulkEditRow[];
  assignments: BulkEditAssignments;
}): number => {
  const { rows, assignments } = params;
  return getUniqueElementRows(rows).filter(
    (row) => (assignments[row.assignmentKey] ?? []).length === 0
  ).length;
};
