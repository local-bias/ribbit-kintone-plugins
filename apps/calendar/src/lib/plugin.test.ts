import { describe, expect, it } from 'vitest';
import type { AnyPluginConfig } from '@/schema/plugin-config';

// `./plugin` transitively imports `./global` and `@konomi-app/kintone-utilities`, both of
// which read kintone JS API globals (and `location`) eagerly at module-load time. Stub a
// minimal fake before importing anything that pulls them in, since this test runs in Node.
globalThis.kintone = {
  $PLUGIN_ID: 'test-plugin-id',
  app: { getId: () => null },
  mobile: { app: { getId: () => null } },
  getLoginUser: () => ({ language: 'ja' }),
} as unknown as typeof kintone;
if (typeof location === 'undefined') {
  (globalThis as { location?: Location }).location = { pathname: '/k/1/' } as Location;
}

const { createConfig, getNewCondition, migrateConfig, validateCondition } = await import(
  './plugin'
);

describe('migrateConfig', () => {
  it('migrates a V1 config to the latest version with editMode defaulted to simple', () => {
    const v1: AnyPluginConfig = {
      version: 1,
      conditions: [
        {
          viewId: '',
          initialView: 'dayGridMonth',
          enablesAllDay: true,
          allDayOption: '',
          enablesNote: false,
          slotMaxTime: '24:00:00',
          slotMinTime: '0:00:00',
          calendarEvent: {
            titleField: 'title',
            startField: 'start',
            endField: 'end',
            allDayField: '',
            noteField: '',
            categoryField: '',
          },
        },
      ],
    };

    const migrated = migrateConfig(v1);

    expect(migrated.version).toBe(8);
    for (const condition of migrated.conditions) {
      expect(condition.editMode).toBe('simple');
    }
  });

  it('migrates a V5 config to the latest version with editMode defaulted to simple', () => {
    const v5: AnyPluginConfig = {
      version: 5,
      common: {},
      conditions: [
        {
          viewId: '',
          initialView: 'dayGridMonth',
          enablesAllDay: true,
          allDayOption: '',
          enablesNote: false,
          slotMaxTime: '24:00:00',
          slotMinTime: '0:00:00',
          colors: [],
          calendarEvent: {
            inputTitleField: 'title',
            displayTitleField: '',
            startField: 'start',
            endField: 'end',
            allDayField: '',
            noteField: '',
            categoryField: '',
            recurrenceField: '',
          },
          id: 'condition-1',
          daysOfWeek: [1, 2, 3, 4, 5],
          firstDay: 0,
          enablesRecurrence: false,
        },
      ],
    };

    const migrated = migrateConfig(v5);

    expect(migrated.version).toBe(8);
    expect(migrated.conditions[0]!.editMode).toBe('simple');
  });

  it('migrates a V6 config to the latest version without changing the existing behavior', () => {
    const v6: AnyPluginConfig = {
      version: 6,
      common: {},
      conditions: [
        {
          viewId: '1',
          initialView: 'timeGridWeek',
          enablesAllDay: true,
          allDayOption: '',
          enablesNote: false,
          slotMaxTime: '24:00:00',
          slotMinTime: '0:00:00',
          colors: ['#000000'],
          calendarEvent: {
            inputTitleField: 'title',
            displayTitleField: '',
            startField: 'start',
            endField: 'end',
            allDayField: '',
            noteField: '',
            categoryField: '',
            recurrenceField: '',
          },
          id: 'condition-1',
          daysOfWeek: [1, 2, 3, 4, 5],
          firstDay: 0,
          enablesRecurrence: false,
          editMode: 'detailed',
        },
      ],
    };

    const migrated = migrateConfig(v6);
    const condition = migrated.conditions[0]!;

    expect(migrated.version).toBe(8);
    expect(() => validateCondition(condition)).not.toThrow();
    // 既存の設定値は維持される
    expect(condition.editMode).toBe('detailed');
    expect(condition.calendarEvent.inputTitleField).toBe('title');
    // 追加項目は、これまでの挙動と同じになる値で補完される
    expect(condition.slotDuration).toBe('00:30:00');
    expect(condition.scrollsToNow).toBe(false);
    expect(condition.visibleViews).toEqual([]);
    expect(condition.enablesDragAndDrop).toBe(true);
    expect(condition.confirmsReschedule).toBe(false);
    expect(condition.preventsOverlap).toBe(false);
    expect(condition.showsLegend).toBe(false);
    expect(condition.enablesBackgroundEvent).toBe(false);
    expect(condition.backgroundEventOption).toBe('');
    expect(condition.sortOrder).toBe('asc');
    expect(condition.calendarEvent.backgroundEventField).toBe('');
    expect(condition.calendarEvent.sortField).toBe('');
    expect(condition.calendarEvent.assigneeField).toBe('');
  });

  it('leaves an already-latest config untouched', () => {
    const latest = createConfig();
    expect(migrateConfig(latest)).toEqual(latest);
  });
});

describe('migrateConfig (V7)', () => {
  it('migrates a V7 config to V8 with the assignee filter disabled', () => {
    const v7 = { ...createConfig(), version: 7 } as unknown as AnyPluginConfig;
    const migrated = migrateConfig(v7);
    expect(migrated.version).toBe(8);
    expect(migrated.conditions[0]!.calendarEvent.assigneeField).toBe('');
  });
});

describe('createConfig / getNewCondition', () => {
  it('creates a V8 config template with a valid new condition', () => {
    const config = createConfig();
    expect(config.version).toBe(8);
    expect(() => validateCondition(getNewCondition())).not.toThrow();
    expect(getNewCondition().editMode).toBe('detailed');
  });
});
