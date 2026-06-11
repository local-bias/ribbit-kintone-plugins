import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import type { PluginCondition } from '@/schema/plugin-config';
import { applyActions, isConditionMet, resolveFieldValue, runCondition } from './action';

const loginUser = { code: 'taro', name: '田中 太郎' };

const baseCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
  id: 'c1',
  memo: '',
  targetEvents: ['create', 'edit'],
  triggerTimings: ['submit'],
  conditionLogic: 'and',
  conditions: [{ fieldCode: '', conditionType: 'always' }],
  fieldActions: [],
  rowActions: [],
  ...overrides,
});

describe('resolveFieldValue', () => {
  test('複数選択フィールドは改行区切りで配列に変換する', () => {
    const field = { type: 'CHECK_BOX', value: [] } as unknown as kintoneAPI.RecordData[string];
    expect(resolveFieldValue(field, 'A\nB', loginUser)).toEqual(['A', 'B']);
  });

  test('ユーザー選択フィールドの LOGINUSER はログインユーザーへ変換する', () => {
    const field = { type: 'USER_SELECT', value: [] } as unknown as kintoneAPI.RecordData[string];
    expect(resolveFieldValue(field, 'LOGINUSER', loginUser)).toEqual([
      { code: 'taro', name: '田中 太郎' },
    ]);
  });

  test('文字列フィールドはそのまま入力する', () => {
    const field = {
      type: 'SINGLE_LINE_TEXT',
      value: '',
    } as unknown as kintoneAPI.RecordData[string];
    expect(resolveFieldValue(field, 'hello', loginUser)).toBe('hello');
  });
});

describe('isConditionMet', () => {
  test('条件が空（always）の場合は常に成立する', () => {
    const record = {} as kintoneAPI.RecordData;
    expect(isConditionMet(baseCondition(), record)).toBe(true);
  });

  test('AND 条件はすべて満たす場合のみ成立する', () => {
    const condition = baseCondition({
      conditionLogic: 'and',
      conditions: [
        { fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' },
        { fieldCode: 'flag', conditionType: 'equal', conditionValue: 'yes' },
      ],
    });
    const record = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'done' },
      flag: { type: 'SINGLE_LINE_TEXT', value: 'no' },
    } as unknown as kintoneAPI.RecordData;
    expect(isConditionMet(condition, record)).toBe(false);
  });

  test('OR 条件はいずれかを満たせば成立する', () => {
    const condition = baseCondition({
      conditionLogic: 'or',
      conditions: [
        { fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' },
        { fieldCode: 'flag', conditionType: 'equal', conditionValue: 'yes' },
      ],
    });
    const record = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'done' },
      flag: { type: 'SINGLE_LINE_TEXT', value: 'no' },
    } as unknown as kintoneAPI.RecordData;
    expect(isConditionMet(condition, record)).toBe(true);
  });
});

describe('applyActions - フィールド自動入力', () => {
  test('指定フィールドへ値を入力する', () => {
    const record = {
      title: { type: 'SINGLE_LINE_TEXT', value: '' },
    } as unknown as kintoneAPI.RecordData;
    applyActions(
      baseCondition({ fieldActions: [{ id: 'a', fieldCode: 'title', value: '完了' }] }),
      record,
      loginUser
    );
    expect(record.title.value).toBe('完了');
  });
});

describe('applyActions - テーブル行操作', () => {
  const buildRecordWithTable = () =>
    ({
      table: {
        type: 'SUBTABLE',
        value: [
          {
            id: '1',
            value: {
              name: { type: 'SINGLE_LINE_TEXT', value: 'existing' },
              status: { type: 'SINGLE_LINE_TEXT', value: 'open' },
            },
          },
        ],
      },
    }) as unknown as kintoneAPI.RecordData;

  test('add は既存行のテンプレートを基に行を追加する', () => {
    const record = buildRecordWithTable();
    applyActions(
      baseCondition({
        rowActions: [
          {
            id: 'r',
            type: 'add',
            subtableCode: 'table',
            overwrite: false,
            cellValues: [{ fieldCode: 'name', value: 'new' }],
            rowCondition: { fieldCode: '', conditionType: 'always' },
          },
        ],
      }),
      record,
      loginUser
    );
    const rows = record.table.value as unknown as {
      id: string | null;
      value: kintoneAPI.RecordData;
    }[];
    expect(rows).toHaveLength(2);
    expect(rows[1].value.name.value).toBe('new');
    expect(rows[1].value.status.value).toBe('');
    expect(rows[1].id).toBeNull();
  });

  test('add の overwrite は既存行を置き換える', () => {
    const record = buildRecordWithTable();
    applyActions(
      baseCondition({
        rowActions: [
          {
            id: 'r',
            type: 'add',
            subtableCode: 'table',
            overwrite: true,
            cellValues: [{ fieldCode: 'name', value: 'only' }],
            rowCondition: { fieldCode: '', conditionType: 'always' },
          },
        ],
      }),
      record,
      loginUser
    );
    const rows = record.table.value as unknown as { value: kintoneAPI.RecordData }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].value.name.value).toBe('only');
  });

  test('exclude は行内条件に一致する行を削除する', () => {
    const record = {
      table: {
        type: 'SUBTABLE',
        value: [
          { id: '1', value: { status: { type: 'SINGLE_LINE_TEXT', value: 'open' } } },
          { id: '2', value: { status: { type: 'SINGLE_LINE_TEXT', value: 'done' } } },
        ],
      },
    } as unknown as kintoneAPI.RecordData;
    applyActions(
      baseCondition({
        rowActions: [
          {
            id: 'r',
            type: 'exclude',
            subtableCode: 'table',
            overwrite: false,
            cellValues: [],
            rowCondition: { fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' },
          },
        ],
      }),
      record,
      loginUser
    );
    const rows = record.table.value as unknown as { id: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('1');
  });
});

describe('runCondition', () => {
  test('条件を満たさない場合はアクションを適用しない', () => {
    const record = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'open' },
      title: { type: 'SINGLE_LINE_TEXT', value: '' },
    } as unknown as kintoneAPI.RecordData;
    const applied = runCondition(
      baseCondition({
        conditions: [{ fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' }],
        fieldActions: [{ id: 'a', fieldCode: 'title', value: '完了' }],
      }),
      record,
      loginUser
    );
    expect(applied).toBe(false);
    expect(record.title.value).toBe('');
  });
});
