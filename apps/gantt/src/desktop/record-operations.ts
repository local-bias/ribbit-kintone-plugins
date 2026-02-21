import {
  addRecord,
  deleteAllRecords,
  getAllRecords,
  updateRecord,
} from '@konomi-app/kintone-utilities';
import { store } from '@repo/jotai';
import { ganttRecordsAtom } from './public-state';

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** レコードの楽観的更新（API完了前にUIを即時反映） */
export function optimisticUpdateRecord(
  taskId: string,
  updates: Record<string, { value: unknown }>
): void {
  const records = store.get(ganttRecordsAtom);
  const newRecords = records.map((r) => {
    const recordId = (r.$id as { value: string })?.value;
    if (recordId === taskId) {
      const updated = { ...r };
      for (const [key, field] of Object.entries(updates)) {
        (updated as Record<string, unknown>)[key] = field;
      }
      return updated;
    }
    return r;
  });
  store.set(ganttRecordsAtom, newRecords);
}

/** 現在のレコード状態のスナップショットを取得 */
export function getRecordsSnapshot(): Awaited<ReturnType<typeof getAllRecords>> {
  return store.get(ganttRecordsAtom);
}

/** スナップショットからレコード状態を復元 */
export function restoreRecordsSnapshot(snapshot: ReturnType<typeof getRecordsSnapshot>) {
  store.set(ganttRecordsAtom, snapshot);
}

/** タスクの日付を更新する */
export async function updateTaskDates(params: {
  appId: number;
  taskId: string;
  startDateFieldCode: string;
  endDateFieldCode: string;
  newStartDate: Date;
  newEndDate: Date;
  guestSpaceId?: string;
}): Promise<void> {
  const {
    appId,
    taskId,
    startDateFieldCode,
    endDateFieldCode,
    newStartDate,
    newEndDate,
    guestSpaceId,
  } = params;

  await updateRecord({
    app: appId,
    id: Number(taskId),
    record: {
      [startDateFieldCode]: { value: formatDate(newStartDate) },
      [endDateFieldCode]: { value: formatDate(newEndDate) },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクのカテゴリフィールドを更新する */
export async function updateTaskCategory(params: {
  appId: number;
  taskId: string;
  categoryFieldCode: string;
  newCategory: string;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, taskId, categoryFieldCode, newCategory, guestSpaceId } = params;

  await updateRecord({
    app: appId,
    id: Number(taskId),
    record: {
      [categoryFieldCode]: { value: newCategory },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクの担当者フィールドを更新する */
export async function updateTaskAssignee(params: {
  appId: number;
  taskId: string;
  assigneeFieldCode: string;
  newAssigneeCode: string;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, taskId, assigneeFieldCode, newAssigneeCode, guestSpaceId } = params;

  await updateRecord({
    app: appId,
    id: Number(taskId),
    record: {
      [assigneeFieldCode]: {
        value: newAssigneeCode ? [{ code: newAssigneeCode }] : [],
      },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクの開始日のみを更新する */
export async function updateTaskStartDate(params: {
  appId: number;
  taskId: string;
  startDateFieldCode: string;
  newStartDate: Date;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, taskId, startDateFieldCode, newStartDate, guestSpaceId } = params;

  await updateRecord({
    app: appId,
    id: Number(taskId),
    record: {
      [startDateFieldCode]: { value: formatDate(newStartDate) },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクの終了日のみを更新する */
export async function updateTaskEndDate(params: {
  appId: number;
  taskId: string;
  endDateFieldCode: string;
  newEndDate: Date;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, taskId, endDateFieldCode, newEndDate, guestSpaceId } = params;

  await updateRecord({
    app: appId,
    id: Number(taskId),
    record: {
      [endDateFieldCode]: { value: formatDate(newEndDate) },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクの進捗率を更新する */
export async function updateTaskProgress(params: {
  appId: number;
  taskId: string;
  progressFieldCode: string;
  progress: number;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, taskId, progressFieldCode, progress, guestSpaceId } = params;

  await updateRecord({
    app: appId,
    id: Number(taskId),
    record: {
      [progressFieldCode]: { value: String(progress) },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクを削除する */
export async function deleteTask(params: {
  appId: number;
  taskId: string;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, taskId, guestSpaceId } = params;

  await deleteAllRecords({
    app: appId,
    ids: [Number(taskId)],
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** タスクを複製する（元レコードのフィールド値をコピーして新規作成） */
export async function duplicateTask(params: {
  appId: number;
  record: Record<string, { value: unknown }>;
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, record: sourceRecord, guestSpaceId } = params;

  // システムフィールドを除外してコピー
  const systemFields = new Set([
    '$id',
    '$revision',
    'レコード番号',
    '更新者',
    '作成者',
    '更新日時',
    '作成日時',
    'ステータス',
    '作業者',
    'カテゴリー',
  ]);

  const newRecord: Record<string, { value: unknown }> = {};
  for (const [key, field] of Object.entries(sourceRecord)) {
    if (!systemFields.has(key) && field?.value !== undefined) {
      newRecord[key] = { value: field.value };
    }
  }

  await addRecord({
    app: appId,
    record: newRecord,
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** 新規タスクを作成する */
export async function createNewTask(params: {
  appId: number;
  titleFieldCode: string;
  startDateFieldCode: string;
  endDateFieldCode: string;
  title: string;
  startDate: string;
  endDate: string;
  guestSpaceId?: string;
}): Promise<void> {
  const {
    appId,
    titleFieldCode,
    startDateFieldCode,
    endDateFieldCode,
    title,
    startDate,
    endDate,
    guestSpaceId,
  } = params;

  await addRecord({
    app: appId,
    record: {
      [titleFieldCode]: { value: title },
      [startDateFieldCode]: { value: startDate },
      [endDateFieldCode]: { value: endDate },
    },
    guestSpaceId,
    debug: process.env.NODE_ENV === 'development',
  });
}

/** レコード一覧をリフレッシュする */
export async function refreshRecords(params: {
  appId: number;
  fields: string[];
  guestSpaceId?: string;
}): Promise<void> {
  const { appId, fields, guestSpaceId } = params;

  const records = await getAllRecords({
    app: appId,
    fields: ['$id', ...fields],
    guestSpaceId,
    debug: false,
  });

  store.set(ganttRecordsAtom, records);
}
