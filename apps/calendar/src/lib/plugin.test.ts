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

    expect(migrated.version).toBe(6);
    for (const condition of migrated.conditions) {
      expect(condition.editMode).toBe('simple');
    }
  });

  it('migrates a V5 config to V6 with editMode defaulted to simple', () => {
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

    expect(migrated.version).toBe(6);
    expect(migrated.conditions[0].editMode).toBe('simple');
  });

  it('leaves an already-latest config untouched', () => {
    const latest = createConfig();
    expect(migrateConfig(latest)).toEqual(latest);
  });
});

describe('createConfig / getNewCondition', () => {
  it('creates a V6 config template with a valid new condition', () => {
    const config = createConfig();
    expect(config.version).toBe(6);
    expect(() => validateCondition(getNewCondition())).not.toThrow();
    expect(getNewCondition().editMode).toBe('simple');
  });
});
