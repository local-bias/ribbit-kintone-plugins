import { PluginCondition, GanttScale, CategorySetting } from '@/schema/plugin-config';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { useMemo } from 'react';

/** スケール毎の列幅（ピクセル） */
export const COLUMN_WIDTH: Record<GanttScale, number> = {
  day: 40,
  week: 120,
  month: 90,
};

/** 行高さ */
export const GROUP_HEADER_HEIGHT = 36;
export const TASK_ROW_HEIGHT = 32;
export const SIDEBAR_WIDTH = 240;
export const HEADER_HEIGHT = 50;

/** カラーパレット（フォールバック用、最大12色） */
export const COLOR_PALETTE = [
  '#4285F4',
  '#EA4335',
  '#FBBC04',
  '#34A853',
  '#FF6D01',
  '#46BDC6',
  '#7B61FF',
  '#E91E63',
  '#00BCD4',
  '#8BC34A',
  '#FF9800',
  '#9C27B0',
];

export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  assignees: string[];
  /** 担当者のコード（API更新用） */
  assigneeCodes: string[];
  /** 各カテゴリ階層の値（condition.categories の順序に対応） */
  categoryValues: string[];
  progress: number;
  /** 色マッピングに使用する値（色設定が定義されたカテゴリの値） */
  colorValue: string;
  /** カテゴリソート順の値（NaNの場合は未設定） */
  categorySortValue: number;
  record: kintoneAPI.RecordData;
}

export interface CategoryPathEntry {
  fieldCode: string;
  value: string;
}

export interface GanttGroup {
  key: string;
  /** 表示ラベル */
  label: string;
  /** API更新用のコード（担当者の場合はユーザーコード） */
  code: string;
  /** 階層の深さ（0 = トップレベル） */
  depth: number;
  /** 親グループかどうか（子がある場合 true） */
  isParent: boolean;
  /** カテゴリパス（D&D 時にどのフィールドを更新するか判定用） */
  categoryPath: CategoryPathEntry[];
  tasks: GanttTask[];
  collapsed: boolean;
}

export interface DateColumn {
  date: Date;
  label: string;
  isToday: boolean;
  isWeekend: boolean;
  monthLabel?: string;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function getFieldValue(record: kintoneAPI.RecordData, fieldCode: string): string {
  const field = record[fieldCode];
  if (!field) {
    return '';
  }
  return String(field.value ?? '');
}

function getUserNames(record: kintoneAPI.RecordData, fieldCode: string): string[] {
  const field = record[fieldCode];
  if (!field) {
    return [];
  }
  const value = field.value;
  if (Array.isArray(value)) {
    return value.map((u) => {
      if (typeof u === 'object' && u !== null && 'name' in u) {
        return String(
          (u as { name?: string; code?: string }).name || (u as { code?: string }).code || ''
        );
      }
      return '';
    });
  }
  return [];
}

function getUserCodes(record: kintoneAPI.RecordData, fieldCode: string): string[] {
  const field = record[fieldCode];
  if (!field) {
    return [];
  }
  const value = field.value;
  if (Array.isArray(value)) {
    return value.map((u) => {
      if (typeof u === 'object' && u !== null && 'code' in u) {
        return String((u as { code?: string }).code || '');
      }
      return '';
    });
  }
  return [];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a: Date, b: Date): number {
  const msPerDay = 86400000;
  return Math.round((a.getTime() - b.getTime()) / msPerDay);
}

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  );
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getColorForValue(value: string, colorMap: Map<string, string>): string {
  if (!value) {
    return COLOR_PALETTE[0]!;
  }
  if (colorMap.has(value)) {
    return colorMap.get(value)!;
  }
  const index = colorMap.size % COLOR_PALETTE.length;
  const color = COLOR_PALETTE[index]!;
  colorMap.set(value, color);
  return color;
}

/** フィールドからカテゴリ値を取得（USER_SELECT の場合は最初のユーザー名） */
function getCategoryValue(record: kintoneAPI.RecordData, fieldCode: string): string {
  if (!fieldCode) {
    return '';
  }
  const field = record[fieldCode];
  if (!field) {
    return '';
  }
  const value = field.value;
  // USER_SELECT フィールド
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }
    const first = value[0];
    if (typeof first === 'object' && first !== null && 'name' in first) {
      return String((first as { name?: string }).name || '');
    }
    return '';
  }
  return String(value ?? '');
}

/** USER_SELECT フィールドから全ユーザー名の配列を取得 */
function getCategoryUserNames(record: kintoneAPI.RecordData, fieldCode: string): string[] {
  if (!fieldCode) {
    return [];
  }
  const field = record[fieldCode];
  if (!field || !Array.isArray(field.value)) {
    return [];
  }
  return (field.value as { name?: string; code?: string }[]).map((u) =>
    String(u.name || u.code || '')
  );
}

/** フィールドが USER_SELECT かどうかを判定 */
function isUserSelectField(record: kintoneAPI.RecordData, fieldCode: string): boolean {
  if (!fieldCode) {
    return false;
  }
  const field = record[fieldCode];
  if (!field) {
    return false;
  }
  return Array.isArray(field.value);
}

/** カテゴリ色設定から色マップを構築 */
function buildCategoryColorMap(categories: CategorySetting[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  for (const cat of categories) {
    for (const entry of cat.colors) {
      if (entry.value && entry.color) {
        colorMap.set(entry.value, entry.color);
      }
    }
  }
  return colorMap;
}

/** 色設定を持つカテゴリのインデックスを取得（-1 = なし） */
function findColorCategoryIndex(categories: CategorySetting[]): number {
  return categories.findIndex((c) => c.colors.length > 0);
}

// ─── 階層グループ化ヘルパー ──────────────────────────

interface TaskCategoryAssignment {
  task: GanttTask;
  /** 各カテゴリ階層での値（ユーザーフィールドの場合は展開済み） */
  path: string[];
}

/**
 * タスクをカテゴリ階層の各レベルで展開する。
 * USER_SELECT フィールドの場合、ユーザーごとに行を複製する。
 */
function expandTaskCategories(
  task: GanttTask,
  record: kintoneAPI.RecordData,
  categories: CategorySetting[]
): TaskCategoryAssignment[] {
  if (categories.length === 0) {
    return [{ task, path: [] }];
  }

  // 各レベルで取りうる値を配列として取得
  const allLevelValues: string[][] = categories.map((cat) => {
    if (isUserSelectField(record, cat.fieldCode)) {
      const names = getCategoryUserNames(record, cat.fieldCode);
      return names.length > 0 ? names : [''];
    }
    return [getCategoryValue(record, cat.fieldCode) || ''];
  });

  // 直積（カルテシアン積）を求めてすべての組み合わせを生成
  function cartesianProduct(arrays: string[][]): string[][] {
    if (arrays.length === 0) {
      return [[]];
    }
    const [first, ...rest] = arrays;
    const restProduct = cartesianProduct(rest);
    const result: string[][] = [];
    for (const val of first!) {
      for (const rp of restProduct) {
        result.push([val, ...rp]);
      }
    }
    return result;
  }

  const paths = cartesianProduct(allLevelValues);
  return paths.map((path) => ({ task, path }));
}

/**
 * 階層的にグループを構築してフラットなリストとして返す。
 * 各グループには depth と isParent が設定される。
 */
function buildHierarchicalGroups(
  assignments: TaskCategoryAssignment[],
  categories: CategorySetting[],
  condition: PluginCondition
): GanttGroup[] {
  if (categories.length === 0) {
    // カテゴリ未設定 → 1グループにまとめる
    const tasks = assignments.map((a) => a.task);
    return [
      {
        key: '__all__',
        label: '全タスク',
        code: '',
        depth: 0,
        isParent: false,
        categoryPath: [],
        tasks: tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
        collapsed: false,
      },
    ];
  }

  if (categories.length === 1) {
    // 単一カテゴリ → フラットグループ（従来どおり）
    const groupMap = new Map<string, GanttTask[]>();
    for (const { task, path } of assignments) {
      const key = path[0] ?? '';
      const existing = groupMap.get(key) ?? [];
      existing.push(task);
      groupMap.set(key, existing);
    }

    return sortGroupEntries(
      Array.from(groupMap.entries()).map(([key, tasks]) => ({
        key,
        label: key || '未分類',
        code: key,
        depth: 0,
        isParent: false,
        categoryPath: [{ fieldCode: categories[0]!.fieldCode, value: key }],
        tasks: tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
        collapsed: false,
      })),
      condition
    );
  }

  // 複数カテゴリ → 階層グループ
  // まず再帰的にツリー構造を構築し、フラット化する
  interface TreeNode {
    key: string;
    label: string;
    code: string;
    depth: number;
    fieldCode: string;
    value: string;
    children: Map<string, TreeNode>;
    tasks: GanttTask[];
    categoryPath: CategoryPathEntry[];
  }

  // ルートノード（表示されない仮想ノード）
  const root: TreeNode = {
    key: '__root__',
    label: '',
    code: '',
    depth: -1,
    fieldCode: '',
    value: '',
    children: new Map(),
    tasks: [],
    categoryPath: [],
  };

  for (const { task, path } of assignments) {
    let current = root;
    const categoryPath: CategoryPathEntry[] = [];

    for (let depth = 0; depth < path.length; depth++) {
      const value = path[depth] ?? '';
      const fieldCode = categories[depth]?.fieldCode ?? '';
      categoryPath.push({ fieldCode, value });
      const nodeKey = categoryPath.map((e) => e.value).join('|');

      if (!current.children.has(nodeKey)) {
        current.children.set(nodeKey, {
          key: nodeKey,
          label: value || '未分類',
          code: value,
          depth,
          fieldCode,
          value,
          children: new Map(),
          tasks: [],
          categoryPath: [...categoryPath],
        });
      }
      current = current.children.get(nodeKey)!;
    }

    // リーフノードにタスクを追加
    current.tasks.push(task);
  }

  // ツリーをフラット化
  function flatten(node: TreeNode): GanttGroup[] {
    const result: GanttGroup[] = [];

    const sortedChildren = sortGroupEntries(
      Array.from(node.children.values()).map((child) => ({
        key: child.key,
        label: child.label,
        code: child.code,
        depth: child.depth,
        isParent: child.children.size > 0,
        categoryPath: child.categoryPath,
        tasks: child.tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
        collapsed: false,
      })),
      condition
    );

    for (const group of sortedChildren) {
      result.push(group);
      // 対応するツリーノードの子もフラット化
      const treeChild = node.children.get(group.key);
      if (treeChild && treeChild.children.size > 0) {
        result.push(...flatten(treeChild));
      }
    }

    return result;
  }

  return flatten(root);
}

/** グループをソートする（categorySortFieldCode or 名前順） */
function sortGroupEntries(groups: GanttGroup[], condition: PluginCondition): GanttGroup[] {
  return groups.sort((a, b) => {
    if (condition.categorySortFieldCode) {
      const aValues = a.tasks.map((t) => t.categorySortValue).filter((v) => !isNaN(v));
      const bValues = b.tasks.map((t) => t.categorySortValue).filter((v) => !isNaN(v));
      const aMin = aValues.length > 0 ? Math.min(...aValues) : Infinity;
      const bMin = bValues.length > 0 ? Math.min(...bValues) : Infinity;
      if (aMin !== bMin) {
        return aMin - bMin;
      }
    }
    return a.label.localeCompare(b.label, 'ja');
  });
}

export function useGanttLayout(params: {
  records: kintoneAPI.RecordData[];
  condition: PluginCondition | null;
  scale: GanttScale;
  viewDate: Date;
  groupBy: 'category' | 'assignee';
}) {
  const { records, condition, scale, viewDate, groupBy } = params;

  return useMemo(() => {
    if (!condition) {
      return {
        tasks: [],
        groups: [],
        columns: [],
        totalWidth: 0,
        columnWidth: COLUMN_WIDTH[scale],
        rangeStart: startOfDay(viewDate),
        rangeEnd: startOfDay(viewDate),
        dateToX: () => 0,
        todayX: 0,
        colorMap: new Map<string, string>(),
      };
    }

    // カテゴリ色設定からマップを構築
    const configuredColorMap = buildCategoryColorMap(condition.categories);
    const colorCategoryIndex = findColorCategoryIndex(condition.categories);
    // 未指定値のフォールバック用
    const dynamicColorMap = new Map<string, string>(configuredColorMap);

    // レコード → タスク変換
    const tasks: GanttTask[] = [];
    for (const record of records) {
      const startStr = getFieldValue(record, condition.startDateFieldCode);
      const endStr = getFieldValue(record, condition.endDateFieldCode);
      const startParsed = parseDate(startStr);
      const endParsed = parseDate(endStr);

      // 両方とも未設定の場合はスキップ
      if (!startParsed && !endParsed) {
        continue;
      }

      // 片方のみの場合はもう片方を補完
      const start = startParsed ?? endParsed!;
      const end = endParsed ?? startParsed!;

      const progressStr = condition.progressFieldCode
        ? getFieldValue(record, condition.progressFieldCode)
        : '';
      const progressNum = progressStr ? Number(progressStr) : 0;

      // 各カテゴリの値
      const categoryValues = condition.categories.map((cat) =>
        getCategoryValue(record, cat.fieldCode)
      );

      // 色マッピング用の値を取得
      let colorValue = '';
      if (colorCategoryIndex >= 0) {
        colorValue = categoryValues[colorCategoryIndex] ?? '';
        if (colorValue) {
          getColorForValue(colorValue, dynamicColorMap);
        }
      }

      const categorySortStr = condition.categorySortFieldCode
        ? getFieldValue(record, condition.categorySortFieldCode)
        : '';
      const categorySortValue = categorySortStr ? Number(categorySortStr) : NaN;

      tasks.push({
        id: String(record.$id?.value ?? ''),
        title: getFieldValue(record, condition.titleFieldCode),
        startDate: startOfDay(start),
        endDate: startOfDay(end),
        assignees: condition.assigneeFieldCode
          ? getUserNames(record, condition.assigneeFieldCode)
          : [],
        assigneeCodes: condition.assigneeFieldCode
          ? getUserCodes(record, condition.assigneeFieldCode)
          : [],
        categoryValues,
        progress: isNaN(progressNum) ? 0 : Math.min(100, Math.max(0, progressNum)),
        colorValue,
        categorySortValue,
        record,
      });
    }

    // レンジ計算
    let rangeStart: Date;
    let rangeEnd: Date;

    if (tasks.length === 0) {
      rangeStart = addDays(startOfDay(viewDate), -14);
      rangeEnd = addDays(startOfDay(viewDate), 14);
    } else {
      const allStarts = tasks.map((t) => t.startDate.getTime());
      const allEnds = tasks.map((t) => t.endDate.getTime());
      const minStart = new Date(Math.min(...allStarts));
      const maxEnd = new Date(Math.max(...allEnds));

      // パディング追加
      rangeStart = addDays(startOfDay(minStart), -7);
      rangeEnd = addDays(startOfDay(maxEnd), 7);
    }

    // スケールに合わせてレンジを拡張
    if (scale === 'week') {
      rangeStart = startOfWeek(rangeStart);
      rangeEnd = addDays(startOfWeek(rangeEnd), 7);
    } else if (scale === 'month') {
      rangeStart = startOfMonth(rangeStart);
      rangeEnd = endOfMonth(rangeEnd);
    }

    const columnWidth = COLUMN_WIDTH[scale];

    // 列の生成
    const columns: DateColumn[] = [];
    const today = startOfDay(new Date());

    if (scale === 'day') {
      let current = new Date(rangeStart);
      while (current <= rangeEnd) {
        const day = current.getDay();
        columns.push({
          date: new Date(current),
          label: `${current.getDate()}`,
          isToday: current.getTime() === today.getTime(),
          isWeekend: day === 0 || day === 6,
          monthLabel:
            current.getDate() === 1 || columns.length === 0
              ? `${current.getFullYear()}/${current.getMonth() + 1}`
              : undefined,
        });
        current = addDays(current, 1);
      }
    } else if (scale === 'week') {
      let current = new Date(rangeStart);
      while (current <= rangeEnd) {
        const weekEnd = addDays(current, 6);
        columns.push({
          date: new Date(current),
          label: `W${getWeekNumber(current)}`,
          isToday: today >= current && today <= weekEnd,
          isWeekend: false,
          monthLabel:
            columns.length === 0 ||
            current.getMonth() !== columns[columns.length - 1]!.date.getMonth()
              ? `${current.getFullYear()}/${current.getMonth() + 1}`
              : undefined,
        });
        current = addDays(current, 7);
      }
    } else {
      let current = new Date(rangeStart);
      while (current <= rangeEnd) {
        columns.push({
          date: new Date(current),
          label: `${current.getMonth() + 1}月`,
          isToday:
            today.getFullYear() === current.getFullYear() &&
            today.getMonth() === current.getMonth(),
          isWeekend: false,
          monthLabel: `${current.getFullYear()}`,
        });
        current = addMonths(startOfMonth(current), 1);
      }
    }

    const totalWidth = columns.length * columnWidth;

    // 日付→X座標
    function dateToX(date: Date): number {
      if (scale === 'day') {
        const days = diffDays(startOfDay(date), rangeStart);
        return days * columnWidth;
      } else if (scale === 'week') {
        const days = diffDays(startOfDay(date), rangeStart);
        return (days / 7) * columnWidth;
      } else {
        // 月スケール: 月の始めからの比率
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const daysInMonth = diffDays(monthEnd, monthStart) + 1;
        const dayInMonth = diffDays(startOfDay(date), monthStart);
        const monthIndex =
          (date.getFullYear() - rangeStart.getFullYear()) * 12 +
          date.getMonth() -
          rangeStart.getMonth();
        return (monthIndex + dayInMonth / daysInMonth) * columnWidth;
      }
    }

    const todayX = dateToX(today);

    // グループ化
    let groups: GanttGroup[];

    if (groupBy === 'assignee') {
      // 担当者グループ化（フラット）
      const groupMap = new Map<string, { tasks: GanttTask[]; code: string }>();
      for (const task of tasks) {
        if (task.assignees.length > 0) {
          for (let i = 0; i < task.assignees.length; i++) {
            const name = task.assignees[i] ?? '';
            const code = task.assigneeCodes[i] ?? '';
            const existing = groupMap.get(name) ?? { tasks: [], code };
            existing.tasks.push(task);
            groupMap.set(name, existing);
          }
        } else {
          const existing = groupMap.get('') ?? { tasks: [], code: '' };
          existing.tasks.push(task);
          groupMap.set('', existing);
        }
      }

      groups = Array.from(groupMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, 'ja'))
        .map(([key, { tasks: groupTasks, code }]) => ({
          key,
          label: key || '未割当',
          code,
          depth: 0,
          isParent: false,
          categoryPath: [],
          tasks: groupTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
          collapsed: false,
        }));
    } else {
      // カテゴリ階層グループ化
      const assignments: TaskCategoryAssignment[] = [];
      for (const task of tasks) {
        const expanded = expandTaskCategories(task, task.record, condition.categories);
        assignments.push(...expanded);
      }
      groups = buildHierarchicalGroups(assignments, condition.categories, condition);
    }

    return {
      tasks,
      groups,
      columns,
      totalWidth,
      columnWidth,
      rangeStart,
      rangeEnd,
      dateToX,
      todayX,
      colorMap: dynamicColorMap,
    };
  }, [records, condition, scale, viewDate, groupBy]);
}
