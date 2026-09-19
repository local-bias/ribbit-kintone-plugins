import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { createStore } from '@repo/jotai';
import { describe, expect, test, vi } from 'vitest';
import { createConfig, getNewCondition } from '@/lib/plugin';
import {
  currentRecordAtom,
  currentScreenAtom,
  pluginConfigAtom,
  selectedConditionAtom,
  visiblePluginConditionsAtom,
} from './public-state';

vi.mock('@/lib/global', () => ({
  GUEST_SPACE_ID: undefined,
  isDev: false,
  isProd: true,
  LOGIN_USER: { code: 'taro', language: 'ja', name: '田中 太郎' },
  PLUGIN_ID: 'test-plugin-id',
}));

const record = (value: string): kintoneAPI.RecordData =>
  ({ 種別: { type: 'SINGLE_LINE_TEXT', value } }) as kintoneAPI.RecordData;

describe('visiblePluginConditionsAtom', () => {
  test('レコードを更新しても同期的に表示対象を返す', () => {
    const testStore = createStore();
    const condition = {
      ...getNewCondition(),
      tabName: '見積',
      displayConditions: [
        { fieldCode: '種別', conditionType: 'equal' as const, conditionValue: '見積' },
      ],
    };
    testStore.set(pluginConfigAtom, { ...createConfig(), conditions: [condition] });
    testStore.set(currentScreenAtom, 'create');
    testStore.set(currentRecordAtom, record('見積'));

    const visible = testStore.get(visiblePluginConditionsAtom);
    expect(visible).toEqual([condition]);
    expect(visible).not.toBeInstanceOf(Promise);
    expect(testStore.get(selectedConditionAtom)).toBe(condition);

    testStore.set(currentRecordAtom, record('請求'));
    expect(testStore.get(visiblePluginConditionsAtom)).toEqual([]);
    expect(testStore.get(selectedConditionAtom)).toBeNull();
  });
});
