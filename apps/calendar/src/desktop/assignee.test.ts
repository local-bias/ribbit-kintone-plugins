import { describe, expect, it } from 'vitest';
import {
  type Assignee,
  buildAssigneeOptions,
  extractAssignees,
  isAssigneeKeyShown,
  isShownForAssignees,
  toggleAssigneeFilter,
  UNASSIGNED_KEY,
} from './assignee';

describe('extractAssignees', () => {
  it('extracts users from a user selection field', () => {
    expect(
      extractAssignees({
        type: 'USER_SELECT',
        value: [
          { code: 'a', name: 'ユーザーA' },
          { code: 'b', name: 'ユーザーB' },
        ],
      })
    ).toEqual([
      { key: 'a', label: 'ユーザーA', isUser: true },
      { key: 'b', label: 'ユーザーB', isUser: true },
    ]);
  });

  it('extracts the single user of the creator, modifier and assignee fields', () => {
    expect(extractAssignees({ type: 'CREATOR', value: { code: 'a', name: 'A' } })).toEqual([
      { key: 'a', label: 'A', isUser: true },
    ]);
    expect(extractAssignees({ type: 'MODIFIER', value: { code: 'b', name: 'B' } })).toEqual([
      { key: 'b', label: 'B', isUser: true },
    ]);
    expect(
      extractAssignees({ type: 'STATUS_ASSIGNEE', value: [{ code: 'c', name: 'C' }] })
    ).toEqual([{ key: 'c', label: 'C', isUser: true }]);
  });

  it('treats organizations and groups as non-user entities', () => {
    expect(
      extractAssignees({ type: 'ORGANIZATION_SELECT', value: [{ code: 'dev', name: '開発部' }] })
    ).toEqual([{ key: 'dev', label: '開発部', isUser: false }]);
  });

  it('extracts plain values from other fields', () => {
    expect(extractAssignees({ type: 'CHECK_BOX', value: ['会議室A', '会議室B'] })).toEqual([
      { key: '会議室A', label: '会議室A', isUser: false },
      { key: '会議室B', label: '会議室B', isUser: false },
    ]);
    expect(extractAssignees({ type: 'SINGLE_LINE_TEXT', value: '車両1' })).toEqual([
      { key: '車両1', label: '車両1', isUser: false },
    ]);
  });

  it('returns an empty list for empty or missing values', () => {
    expect(extractAssignees(undefined)).toEqual([]);
    expect(extractAssignees({ type: 'SINGLE_LINE_TEXT', value: '' })).toEqual([]);
    expect(extractAssignees({ type: 'USER_SELECT', value: [] })).toEqual([]);
    expect(extractAssignees({ type: 'CREATOR', value: null })).toEqual([]);
  });

  it('removes duplicated entries', () => {
    expect(extractAssignees({ type: 'CHECK_BOX', value: ['A', 'A'] })).toEqual([
      { key: 'A', label: 'A', isUser: false },
    ]);
  });
});

describe('buildAssigneeOptions', () => {
  const a: Assignee = { key: 'a', label: 'あおき', isUser: true };
  const b: Assignee = { key: 'b', label: 'いとう', isUser: true };

  it('lists the unique assignees in label order, with the unassigned entry', () => {
    expect(
      buildAssigneeOptions([{ assignees: [b] }, { assignees: [a, b] }, { assignees: [] }])
    ).toEqual({ assignees: [a, b], hasUnassigned: true });
  });

  it('does not count background events without assignees as unassigned', () => {
    expect(
      buildAssigneeOptions([{ assignees: [a] }, { assignees: [], display: 'background' }])
    ).toEqual({ assignees: [a], hasUnassigned: false });
  });

  it('does not count events whose assignees are not resolved yet as unassigned', () => {
    expect(buildAssigneeOptions([{ assignees: [a] }, {}])).toEqual({
      assignees: [a],
      hasUnassigned: false,
    });
  });
});

describe('toggleAssigneeFilter / isAssigneeKeyShown', () => {
  it('hides a toggled assignee and keeps showing assignees that appear later', () => {
    const filter = toggleAssigneeFilter(null, 'a');
    expect(filter).toEqual({ mode: 'hidden', keys: ['a'] });
    expect(isAssigneeKeyShown('a', filter)).toBe(false);
    // 絞り込みの後に読み込まれた担当者は表示される
    expect(isAssigneeKeyShown('later', filter)).toBe(true);
  });

  it('returns to no filter when every hidden assignee is shown again', () => {
    expect(toggleAssigneeFilter({ mode: 'hidden', keys: ['a'] }, 'a')).toBeNull();
  });

  it('adds and removes assignees while showing only some of them', () => {
    const only = { mode: 'only' as const, keys: ['a'] };
    expect(isAssigneeKeyShown('b', only)).toBe(false);
    const added = toggleAssigneeFilter(only, 'b');
    expect(added).toEqual({ mode: 'only', keys: ['a', 'b'] });
    expect(toggleAssigneeFilter(added, 'a')).toEqual({ mode: 'only', keys: ['b'] });
  });
});

describe('isShownForAssignees', () => {
  const a = { key: 'a', label: 'A', isUser: true };
  const b = { key: 'b', label: 'B', isUser: true };

  it('shows every event when no filter is applied', () => {
    expect(isShownForAssignees({ assignees: [] }, null)).toBe(true);
  });

  it('shows an event when any of its assignees is shown', () => {
    expect(isShownForAssignees({ assignees: [a, b] }, { mode: 'only', keys: ['b'] })).toBe(true);
    expect(isShownForAssignees({ assignees: [a, b] }, { mode: 'only', keys: ['c'] })).toBe(false);
    expect(isShownForAssignees({ assignees: [a] }, { mode: 'hidden', keys: ['a'] })).toBe(false);
  });

  it('controls unassigned events with the unassigned entry', () => {
    expect(isShownForAssignees({ assignees: [] }, { mode: 'only', keys: [UNASSIGNED_KEY] })).toBe(
      true
    );
    expect(isShownForAssignees({ assignees: [] }, { mode: 'hidden', keys: [UNASSIGNED_KEY] })).toBe(
      false
    );
  });

  it('always shows background events without assignees, such as holidays', () => {
    expect(
      isShownForAssignees({ assignees: [], display: 'background' }, { mode: 'only', keys: ['a'] })
    ).toBe(true);
  });

  it('always shows events whose assignees are not resolved yet', () => {
    expect(isShownForAssignees({}, { mode: 'only', keys: ['a'] })).toBe(true);
  });
});
