import { type Assignee, buildAssigneeOptions, toggleAssigneeFilter } from '@/desktop/assignee';
import { fetchUserIconUrls } from '@/desktop/user-icons';
import { atom } from 'jotai';
import { calendarEventsAtom } from './calendar';
import { displayingAssigneesAtom } from './sidebar';

/** サイドバーに表示する担当者の一覧(読み込んだ予定に含まれる担当者から組み立てる) */
export const assigneeOptionsAtom = atom((get) => buildAssigneeOptions(get(calendarEventsAtom)));

/** 担当者(または未設定)の表示・非表示を切り替えます */
export const toggleDisplayingAssigneeAtom = atom(null, (_, set, key: string) => {
  set(displayingAssigneesAtom, (current) => toggleAssigneeFilter(current, key));
});

/** 指定した担当者(または未設定)の予定のみを表示します */
export const showOnlyAssigneeAtom = atom(null, (_, set, key: string) => {
  set(displayingAssigneesAtom, { mode: 'only', keys: [key] });
});

/** 担当者による絞り込みを解除します */
export const resetDisplayingAssigneesAtom = atom(null, (_, set) => {
  set(displayingAssigneesAtom, null);
});

/** 取得済みのユーザーのアイコンのURL(ユーザーコード -> URL。アイコンが無いユーザーは空文字) */
export const userIconUrlsAtom = atom<Record<string, string>>({});

/** アイコンを取得中のユーザーコード(同じユーザーを重複して問い合わせないため) */
const pendingUserIconCodesAtom = atom<ReadonlySet<string>>(new Set<string>());

/**
 * 指定した担当者のうち、まだアイコンを取得していないユーザーのアイコンを取得します
 *
 * アイコンのURLは形式が変わる可能性があるため保存せず、表示のたびに(メモリ上でのみ保持して)取得する
 */
export const loadUserIconsAtom = atom(null, async (get, set, assignees: Assignee[]) => {
  const loaded = get(userIconUrlsAtom);
  const pending = get(pendingUserIconCodesAtom);
  const codes = assignees
    .filter(({ isUser, key }) => isUser && !(key in loaded) && !pending.has(key))
    .map(({ key }) => key);
  if (codes.length === 0) {
    return;
  }

  set(pendingUserIconCodesAtom, (current) => new Set([...current, ...codes]));
  try {
    const { urls, failed } = await fetchUserIconUrls(codes);
    // 問い合わせに失敗したユーザーは記録せず、次の機会に再取得する。応答に含まれなかったユーザーは
    // 空文字で記録し、再取得を繰り返さない(頭文字で表示する)
    const resolved = Object.fromEntries(
      codes.filter((code) => !failed.includes(code)).map((code) => [code, urls[code] ?? ''])
    );
    set(userIconUrlsAtom, (current) => ({ ...current, ...resolved }));
  } finally {
    set(pendingUserIconCodesAtom, (current) => {
      const next = new Set(current);
      for (const code of codes) {
        next.delete(code);
      }
      return next;
    });
  }
});
