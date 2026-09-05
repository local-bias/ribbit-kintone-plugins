import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test, vi } from 'vitest';
import type { PluginCondition } from '@/schema/plugin-config';
import { getNewCondition } from './plugin';

vi.mock('./global', () => ({
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
}));

import { getWatchedFieldCodes, isTabVisible, type TabVisibilityContext } from './tab-visibility';

const baseContext: TabVisibilityContext = {
  screen: 'detail',
  record: null,
  viewer: null,
  status: null,
};

const condition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
  ...getNewCondition(),
  ...overrides,
});

const record = (values: Record<string, string>): kintoneAPI.RecordData =>
  Object.fromEntries(
    Object.entries(values).map(([code, value]) => [code, { type: 'SINGLE_LINE_TEXT', value }])
  ) as kintoneAPI.RecordData;

describe('isTabVisible / 画面種別', () => {
  test('対象画面に含まれていれば表示する', () => {
    expect(isTabVisible(condition(), baseContext)).toBe(true);
  });

  test('対象画面に含まれていなければ表示しない', () => {
    expect(isTabVisible(condition({ targetScreens: ['create', 'edit'] }), baseContext)).toBe(false);
  });

  test('対象画面が空の場合はどの画面にも表示しない', () => {
    expect(isTabVisible(condition({ targetScreens: [] }), baseContext)).toBe(false);
  });
});

describe('isTabVisible / レコードの値による条件', () => {
  const target = condition({
    displayConditions: [{ fieldCode: '種別', conditionType: 'equal', conditionValue: '見積' }],
  });

  test('条件に一致するレコードでは表示する', () => {
    expect(isTabVisible(target, { ...baseContext, record: record({ 種別: '見積' }) })).toBe(true);
  });

  test('条件に一致しないレコードでは表示しない', () => {
    expect(isTabVisible(target, { ...baseContext, record: record({ 種別: '請求' }) })).toBe(false);
  });

  test('レコードが取得できていない場合は表示する', () => {
    expect(isTabVisible(target, baseContext)).toBe(true);
  });

  test('`or`は、いずれかの条件を満たせば表示する', () => {
    const orCondition = condition({
      displayConditionLogic: 'or',
      displayConditions: [
        { fieldCode: '種別', conditionType: 'equal', conditionValue: '見積' },
        { fieldCode: '種別', conditionType: 'equal', conditionValue: '請求' },
      ],
    });

    expect(isTabVisible(orCondition, { ...baseContext, record: record({ 種別: '請求' }) })).toBe(
      true
    );
  });

  test('`and`は、すべての条件を満たさなければ表示しない', () => {
    const andCondition = condition({
      displayConditions: [
        { fieldCode: '種別', conditionType: 'equal', conditionValue: '見積' },
        { fieldCode: '状態', conditionType: 'equal', conditionValue: '承認済' },
      ],
    });

    expect(
      isTabVisible(andCondition, {
        ...baseContext,
        record: record({ 種別: '見積', 状態: '下書き' }),
      })
    ).toBe(false);
  });
});

describe('isTabVisible / 閲覧者による条件', () => {
  const viewer = { code: 'taro', groups: ['sales'], organizations: ['tokyo'] };

  test('条件が空の場合は全員に表示する', () => {
    expect(isTabVisible(condition(), { ...baseContext, viewer })).toBe(true);
  });

  test('ユーザー・グループ・組織のいずれかに一致すれば表示する', () => {
    expect(isTabVisible(condition({ viewerUsers: ['taro'] }), { ...baseContext, viewer })).toBe(
      true
    );
    expect(isTabVisible(condition({ viewerGroups: ['sales'] }), { ...baseContext, viewer })).toBe(
      true
    );
    expect(
      isTabVisible(condition({ viewerOrganizations: ['tokyo'] }), { ...baseContext, viewer })
    ).toBe(true);
  });

  test('どれにも一致しなければ表示しない', () => {
    expect(
      isTabVisible(condition({ viewerUsers: ['hanako'], viewerGroups: ['dev'] }), {
        ...baseContext,
        viewer,
      })
    ).toBe(false);
  });

  test('閲覧者情報を取得できていない場合は表示する(表示側へ倒す)', () => {
    expect(isTabVisible(condition({ viewerUsers: ['hanako'] }), baseContext)).toBe(true);
  });
});

describe('isTabVisible / プロセス管理のステータス', () => {
  test('指定が空の場合はすべてのステータスで表示する', () => {
    expect(isTabVisible(condition(), { ...baseContext, status: '未処理' })).toBe(true);
  });

  test('指定したステータスのときだけ表示する', () => {
    const target = condition({ statuses: ['承認済'] });

    expect(isTabVisible(target, { ...baseContext, status: '承認済' })).toBe(true);
    expect(isTabVisible(target, { ...baseContext, status: '未処理' })).toBe(false);
  });

  test('プロセス管理が無効な場合は表示する', () => {
    expect(isTabVisible(condition({ statuses: ['承認済'] }), baseContext)).toBe(true);
  });
});

describe('getWatchedFieldCodes', () => {
  test('表示条件が参照するフィールドコードを重複なく返す', () => {
    const conditions = [
      condition({
        displayConditions: [
          { fieldCode: '種別', conditionType: 'equal', conditionValue: 'A' },
          { fieldCode: '状態', conditionType: 'equal', conditionValue: 'B' },
        ],
      }),
      condition({
        displayConditions: [{ fieldCode: '種別', conditionType: 'equal', conditionValue: 'C' }],
      }),
    ];

    expect(new Set(getWatchedFieldCodes(conditions))).toEqual(new Set(['種別', '状態']));
  });

  test('サブテーブル内のフィールドはサブテーブルのコードを返す', () => {
    const conditions = [
      condition({
        displayConditions: [
          {
            fieldCode: '単価',
            subtableCode: '明細',
            conditionType: 'equal',
            conditionValue: '100',
          },
        ],
      }),
    ];

    expect(getWatchedFieldCodes(conditions)).toEqual(['明細']);
  });

  test('条件が無ければ空配列を返す', () => {
    expect(getWatchedFieldCodes([condition()])).toEqual([]);
  });
});
