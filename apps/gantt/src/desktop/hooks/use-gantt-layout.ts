import { PluginCondition, GanttScale } from '@/schema/plugin-config';
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
export const SIDEBAR_WIDTH = 200;
export const HEADER_HEIGHT = 50;

/** カラーパレット（最大12色） */
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
  category: string;
  progress: number;
  colorValue: string;
  /** カテゴリソート順の値（NaNの場合は未設定） */
  categorySortValue: number;
  record: kintoneAPI.RecordData;
}

export interface GanttGroup {
  key: string;
  /** 表示ラベル */
  label: string;
  /** API更新用のコード（担当者の場合はユーザーコード） */
  code: string;
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

    const colorMap = new Map<string, string>();

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

      const colorValue = condition.colorFieldCode
        ? getFieldValue(record, condition.colorFieldCode)
        : '';

      const categorySortStr = condition.categorySortFieldCode
        ? getFieldValue(record, condition.categorySortFieldCode)
        : '';
      const categorySortValue = categorySortStr ? Number(categorySortStr) : NaN;

      // 色マッピング構築
      if (colorValue) {
        getColorForValue(colorValue, colorMap);
      }

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
        category: condition.categoryFieldCode
          ? getFieldValue(record, condition.categoryFieldCode)
          : '',
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
    const groupMap = new Map<string, { tasks: GanttTask[]; code: string }>();
    for (const task of tasks) {
      if (groupBy === 'assignee') {
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
      } else {
        const key = task.category || '';
        const existing = groupMap.get(key) ?? { tasks: [], code: key };
        existing.tasks.push(task);
        groupMap.set(key, existing);
      }
    }

    const groups: GanttGroup[] = Array.from(groupMap.entries())
      .sort(([a, aData], [b, bData]) => {
        // categorySortFieldCodeが設定されている場合、グループ内のタスクのソート値の最小値でソート
        if (condition.categorySortFieldCode && groupBy === 'category') {
          const aValues = aData.tasks.map((t) => t.categorySortValue).filter((v) => !isNaN(v));
          const bValues = bData.tasks.map((t) => t.categorySortValue).filter((v) => !isNaN(v));
          const aMin = aValues.length > 0 ? Math.min(...aValues) : Infinity;
          const bMin = bValues.length > 0 ? Math.min(...bValues) : Infinity;
          if (aMin !== bMin) {
            return aMin - bMin;
          }
        }
        return a.localeCompare(b, 'ja');
      })
      .map(([key, { tasks: groupTasks, code }]) => ({
        key,
        label: key || (groupBy === 'assignee' ? '未割当' : '未分類'),
        code,
        tasks: groupTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
        collapsed: false,
      }));

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
      colorMap,
    };
  }, [records, condition, scale, viewDate, groupBy]);
}
