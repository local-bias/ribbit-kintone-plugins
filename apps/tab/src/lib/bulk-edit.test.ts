import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test, vi } from 'vitest';
import type { PluginCondition } from '@/schema/plugin-config';
import { getNewCondition } from './plugin';

vi.mock('./global', () => ({
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
}));

import {
  applyAssignments,
  type BulkEditElementRow,
  type BulkEditRow,
  buildBulkEditRows,
  countAnonymousElements,
  countUnassignedElements,
  readAssignments,
  toAssignmentKey,
  toggleAllAssignments,
  toggleAssignment,
} from './bulk-edit';

/** テスト環境にはDOMParserが無いため、タグを取り除くだけの簡易な実装で代用する */
const parseLabelText = (label: string) => label.replace(/<[^>]*>/g, '').trim();

const field = (code: string) => ({ type: 'SINGLE_LINE_TEXT', code }) as kintoneAPI.LayoutField;
const label = (text: string, elementId?: string) =>
  ({ type: 'LABEL', label: text, ...(elementId ? { elementId } : {}) }) as kintoneAPI.LayoutField;
const spacer = (elementId: string) => ({ type: 'SPACER', elementId }) as kintoneAPI.LayoutField;
const hr = (elementId?: string) =>
  ({ type: 'HR', ...(elementId ? { elementId } : {}) }) as kintoneAPI.LayoutField;
const row = (...fields: kintoneAPI.LayoutField[]) =>
  ({ type: 'ROW', fields }) as kintoneAPI.Layout[number];

const properties = (entries: Record<string, string>): kintoneAPI.FieldProperty[] =>
  Object.entries(entries).map(([code, name]) => ({
    code,
    label: name,
  })) as kintoneAPI.FieldProperty[];

/**
 * ラベル・フィールド・グループ・スペース・罫線を一通り含むレイアウト
 */
const layout: kintoneAPI.Layout = [
  row(label('<b>基本情報</b>'), field('顧客名')),
  row(hr(), spacer('summary'), { type: 'SPACER', elementId: '' } as kintoneAPI.LayoutField),
  { type: 'SUBTABLE', code: '明細', fields: [field('品目')] } as kintoneAPI.Layout[number],
  {
    type: 'GROUP',
    code: '請求先',
    layout: [row(label('基本情報'), field('請求先名'))],
  } as kintoneAPI.Layout[number],
  row(label('   ')),
  row(hr('line'), label('', 'notice')),
];

const fieldProperties = properties({
  顧客名: 'お客様名',
  明細: '明細テーブル',
  請求先: '請求先グループ',
  請求先名: '請求先の名称',
});

const buildRows = () => buildBulkEditRows({ layout, fieldProperties, parseLabelText });

const condition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
  ...getNewCondition(),
  ...overrides,
});

const elementRows = (rows: BulkEditRow[]) =>
  rows.filter((r): r is BulkEditElementRow => r.kind === 'element');

describe('buildBulkEditRows', () => {
  test('フォームレイアウトの順序どおりに行を組み立てる', () => {
    const rows = buildRows();
    expect(rows.map((r) => (r.kind === 'element' ? r.assignmentKey : r.kind))).toStrictEqual([
      'label:基本情報',
      'field:顧客名',
      'anonymousHr',
      'space:summary',
      'anonymousSpace',
      'field:明細',
      'group:請求先',
      'label:基本情報',
      'field:請求先名',
      'anonymousLabel',
      'hr:line',
      'label:notice',
    ]);
  });

  test('フィールド情報から表示名を解決し、見つからない場合はコードを使う', () => {
    const names = Object.fromEntries(
      elementRows(buildRows()).map((r) => [r.assignmentKey, r.name])
    );
    expect(names['field:顧客名']).toBe('お客様名');
    expect(names['field:明細']).toBe('明細テーブル');
    expect(names['group:請求先']).toBe('請求先グループ');
    expect(names['space:summary']).toBe('summary');
  });

  test('サブテーブルは表そのものを1つのフィールドとして扱い、内部のフィールドは展開しない', () => {
    expect(elementRows(buildRows()).map((r) => r.assignmentKey)).not.toContain('field:品目');
  });

  test('グループフィールドの内側にある要素には`nested`を立てる', () => {
    const nested = elementRows(buildRows())
      .filter((r) => r.nested)
      .map((r) => r.assignmentKey);
    expect(nested).toStrictEqual(['label:基本情報', 'field:請求先名']);
  });

  test('要素IDも文言も無いラベルは割り当ての対象にせず、行としてだけ残す', () => {
    const rows = buildRows();
    expect(rows.filter((r) => r.kind === 'anonymousLabel')).toHaveLength(1);
    expect(elementRows(rows).filter((r) => r.type === 'label')).toHaveLength(3);
  });

  test('要素IDを持つラベルは、文言が空でも要素IDをキーとして割り当てられる', () => {
    const [row] = elementRows(buildRows()).filter((r) => r.assignmentKey === 'label:notice');
    expect(row).toMatchObject({ type: 'label', key: 'notice', name: 'notice' });
  });

  test('要素IDを持つ罫線は割り当ての対象にし、持たない罫線は行としてだけ残す', () => {
    const rows = buildRows();
    expect(rows.filter((r) => r.kind === 'anonymousHr')).toHaveLength(1);
    expect(elementRows(rows).filter((r) => r.type === 'hr')).toMatchObject([
      { key: 'line', name: 'line' },
    ]);
  });

  test('同じ文言のラベルが複数ある場合は重複として印を付ける', () => {
    const duplicated = elementRows(buildRows()).filter((r) => r.duplicated);
    expect(duplicated).toHaveLength(2);
    expect(duplicated.every((r) => r.assignmentKey === 'label:基本情報')).toBe(true);
  });

  test('要素IDが未設定のスペースは割り当ての対象にせず、行としてだけ残す', () => {
    const rows = buildRows();
    expect(rows.filter((r) => r.kind === 'anonymousSpace')).toHaveLength(1);
    expect(elementRows(rows).map((r) => r.assignmentKey)).not.toContain('space:');
  });

  test('行のidは重複しない', () => {
    const ids = buildRows().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('readAssignments', () => {
  const rows = buildRows();

  test('`sub`(指定したものを非表示)では、指定されていない要素が割り当て済みになる', () => {
    const conditions = [condition({ id: 'a', fieldDisplayMode: 'sub', fields: ['顧客名'] })];
    const assignments = readAssignments({ rows, conditions });
    expect(assignments['field:顧客名']).toStrictEqual([]);
    expect(assignments['field:明細']).toStrictEqual(['a']);
  });

  test('`add`(指定したものだけ表示)では、指定された要素が割り当て済みになる', () => {
    const conditions = [condition({ id: 'a', fieldDisplayMode: 'add', fields: ['顧客名'] })];
    const assignments = readAssignments({ rows, conditions });
    expect(assignments['field:顧客名']).toStrictEqual(['a']);
    expect(assignments['field:明細']).toStrictEqual([]);
  });

  test('複数のタブに表示される要素は、全てのタブIDを持つ', () => {
    const conditions = [
      condition({ id: 'a', fieldDisplayMode: 'add', fields: ['顧客名'] }),
      condition({ id: 'b', fieldDisplayMode: 'add', fields: ['顧客名', '明細'] }),
    ];
    expect(readAssignments({ rows, conditions })['field:顧客名']).toStrictEqual(['a', 'b']);
  });

  test('種別ごとに、それぞれの表示方法と対象を参照する', () => {
    const conditions = [
      condition({
        id: 'a',
        fieldDisplayMode: 'add',
        fields: [],
        groupDisplayMode: 'add',
        groups: ['請求先'],
        spaceDisplayMode: 'add',
        spaceIds: ['summary'],
        labelDisplayMode: 'add',
        labels: ['基本情報'],
        hrDisplayMode: 'add',
        hrs: ['line'],
      }),
    ];
    const assignments = readAssignments({ rows, conditions });
    expect(assignments['group:請求先']).toStrictEqual(['a']);
    expect(assignments['space:summary']).toStrictEqual(['a']);
    expect(assignments['label:基本情報']).toStrictEqual(['a']);
    expect(assignments['hr:line']).toStrictEqual(['a']);
    expect(assignments['field:顧客名']).toStrictEqual([]);
  });
});

describe('applyAssignments', () => {
  const rows = buildRows();

  const roundTrip = (conditions: PluginCondition[], newElementPolicy: 'show' | 'hide') => {
    const assignments = readAssignments({ rows, conditions });
    const applied = applyAssignments({ conditions, rows, assignments, newElementPolicy });
    return readAssignments({ rows, conditions: applied });
  };

  test.each(['show', 'hide'] as const)(
    '書き戻しても、要素ごとの表示・非表示は変わらない (%s)',
    (policy) => {
      const conditions = [
        condition({ id: 'a', fieldDisplayMode: 'add', fields: ['顧客名'], labels: ['基本情報'] }),
        condition({ id: 'b', fieldDisplayMode: 'sub', fields: ['顧客名'] }),
      ];
      expect(roundTrip(conditions, policy)).toStrictEqual(readAssignments({ rows, conditions }));
    }
  );

  test('`show`では、後から追加された要素が表示されるよう`sub`で書き出す', () => {
    const conditions = [condition({ id: 'a', fieldDisplayMode: 'add', fields: ['顧客名'] })];
    const [applied] = applyAssignments({
      conditions,
      rows,
      assignments: readAssignments({ rows, conditions }),
      newElementPolicy: 'show',
    });
    expect(applied?.fieldDisplayMode).toBe('sub');
    expect(applied?.fields).toStrictEqual(['明細', '請求先名']);
  });

  test('`hide`では、後から追加された要素が非表示になるよう`add`で書き出す', () => {
    const conditions = [
      condition({ id: 'a', fieldDisplayMode: 'sub', fields: ['明細', '請求先名'] }),
    ];
    const [applied] = applyAssignments({
      conditions,
      rows,
      assignments: readAssignments({ rows, conditions }),
      newElementPolicy: 'hide',
    });
    expect(applied?.fieldDisplayMode).toBe('add');
    expect(applied?.fields).toStrictEqual(['顧客名']);
  });

  test('どのタブにも割り当てられていない要素は、どちらの扱いでも全てのタブで非表示になる', () => {
    const conditions = [condition({ id: 'a' }), condition({ id: 'b' })];
    const assignments = { ...readAssignments({ rows, conditions }), 'field:顧客名': [] };
    for (const newElementPolicy of ['show', 'hide'] as const) {
      const applied = applyAssignments({ conditions, rows, assignments, newElementPolicy });
      expect(readAssignments({ rows, conditions: applied })['field:顧客名']).toStrictEqual([]);
    }
  });

  test('フォーム上に存在しない値は、書き戻しても失われない', () => {
    const conditions = [
      condition({ id: 'a', labelDisplayMode: 'add', labels: ['基本情報', '削除済みの見出し'] }),
    ];
    const [applied] = applyAssignments({
      conditions,
      rows,
      assignments: readAssignments({ rows, conditions }),
      newElementPolicy: 'show',
    });
    expect(applied?.labels).toContain('削除済みの見出し');
  });

  test('タブ情報や表示条件は書き換えない', () => {
    const conditions = [condition({ id: 'a', tabName: '基本', statuses: ['進行中'] })];
    const [applied] = applyAssignments({
      conditions,
      rows,
      assignments: readAssignments({ rows, conditions }),
      newElementPolicy: 'show',
    });
    expect(applied?.tabName).toBe('基本');
    expect(applied?.statuses).toStrictEqual(['進行中']);
  });
});

describe('割り当ての操作', () => {
  const rows = buildRows();
  const key = toAssignmentKey('field', '顧客名');

  test('toggleAssignment: 割り当ての追加と解除ができる', () => {
    const added = toggleAssignment({
      assignments: { [key]: [] },
      assignmentKey: key,
      conditionId: 'a',
      assigned: true,
    });
    expect(added[key]).toStrictEqual(['a']);

    const removed = toggleAssignment({
      assignments: added,
      assignmentKey: key,
      conditionId: 'a',
      assigned: false,
    });
    expect(removed[key]).toStrictEqual([]);
  });

  test('toggleAssignment: 同じタブIDを重複して追加しない', () => {
    const assignments = toggleAssignment({
      assignments: { [key]: ['a'] },
      assignmentKey: key,
      conditionId: 'a',
      assigned: true,
    });
    expect(assignments[key]).toStrictEqual(['a']);
  });

  test('toggleAllAssignments: 全ての要素をまとめて切り替える', () => {
    const assignments = toggleAllAssignments({
      assignments: {},
      rows,
      conditionId: 'a',
      assigned: true,
    });
    expect(countUnassignedElements({ rows, assignments })).toBe(0);

    const cleared = toggleAllAssignments({ assignments, rows, conditionId: 'a', assigned: false });
    expect(countUnassignedElements({ rows, assignments: cleared })).toBe(
      elementRows(rows).filter(
        (r, i, all) => all.findIndex((x) => x.assignmentKey === r.assignmentKey) === i
      ).length
    );
  });

  test('countUnassignedElements: 重複する要素は1件として数える', () => {
    const conditions = [condition({ id: 'a', labelDisplayMode: 'add', labels: [] })];
    const assignments = readAssignments({ rows, conditions });
    // ラベル「基本情報」は2箇所に現れるが、割り当ては1件として扱われる
    expect(assignments['label:基本情報']).toStrictEqual([]);
    expect(countUnassignedElements({ rows, assignments })).toBe(
      Object.values(assignments).filter((ids) => ids.length === 0).length
    );
  });

  test('countAnonymousElements: 要素IDが未設定で割り当てられない要素を数える', () => {
    // スペース・ラベル・罫線が1件ずつ
    expect(countAnonymousElements(rows)).toBe(3);
  });
});
