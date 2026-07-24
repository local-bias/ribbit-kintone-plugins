import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnyPluginConfig } from '@/schema/plugin-config';

// Both `./inline-record` and `@/lib/plugin` (via `restorePluginConfig`) transitively touch
// kintone JS API globals at module-load time, which only exist inside the real kintone
// runtime. Stub a minimal fake before importing anything that pulls them in.
globalThis.kintone = {
  $PLUGIN_ID: 'test-plugin-id',
  app: { getId: () => null },
  mobile: { app: { getId: () => null } },
  getLoginUser: () => ({ language: 'ja' }),
} as unknown as typeof kintone;

// `postParentMessage`/`installInlineCreateCancelGuard` check `window.parent === window` to
// detect "not running inside an iframe" and no-op. Simulate that (self-referencing `window`)
// so those calls short-circuit instead of throwing in this window-less Node test environment.
(globalThis as { window?: Window }).window = globalThis as unknown as Window;
(globalThis.window as unknown as { parent: unknown }).parent = globalThis.window;

const condition = {
  viewId: '1',
  initialView: 'dayGridMonth',
  enablesAllDay: true,
  allDayOption: 'allDay',
  enablesNote: true,
  slotMaxTime: '24:00:00',
  slotMinTime: '0:00:00',
  colors: ['#fff'],
  calendarEvent: {
    inputTitleField: 'title',
    displayTitleField: '',
    startField: 'start',
    endField: 'end',
    allDayField: 'allDayField',
    noteField: 'note',
    categoryField: 'category',
    recurrenceField: 'recurrence',
  },
  id: 'condition-1',
  daysOfWeek: [1, 2, 3, 4, 5] as const,
  firstDay: 0,
  enablesRecurrence: true,
  editMode: 'detailed' as const,
};

const storedConfig: AnyPluginConfig = {
  version: 6,
  common: {},
  conditions: [condition],
};

vi.mock('@/lib/plugin', () => ({
  restorePluginConfig: () => storedConfig,
}));

const setLocation = (href: string) => {
  const url = new URL(href);
  (globalThis as { location?: Location }).location = url as unknown as Location;
};

beforeEach(() => {
  setLocation('https://example.cybozu.com/k/1/');
});

const {
  buildInlineEditUrl,
  buildInlineCreateUrl,
  applyInlineCreateInitialValues,
  isInlineCreatePage,
  isInlineEditPage,
  CALENDAR_INLINE_CREATE_PARAM,
  CALENDAR_INLINE_EDIT_PARAM,
} = await import('./inline-record');

describe('buildInlineEditUrl', () => {
  it('builds a pathname-relative show URL in edit mode with the record id in the hash', () => {
    const url = buildInlineEditUrl('42');
    expect(url).toBe('/k/1/show?calendar_inline_edit=1#record=42&mode=edit');
  });
});

describe('buildInlineCreateUrl', () => {
  it('round-trips initial values through the URL', () => {
    const url = buildInlineCreateUrl({
      condition,
      initialValues: [
        { fieldCode: 'start', value: '2026-07-14' },
        { fieldCode: 'end', value: '2026-07-15' },
      ],
    });

    expect(url.startsWith('/k/1/edit?')).toBe(true);
    const search = new URLSearchParams(url.split('?')[1]);
    expect(search.get(CALENDAR_INLINE_CREATE_PARAM)).toBe('1');
    expect(search.get('calendar_inline_create_condition')).toBe('condition-1');
    expect(JSON.parse(search.get('calendar_inline_create_values')!)).toEqual([
      { fieldCode: 'start', value: '2026-07-14' },
      { fieldCode: 'end', value: '2026-07-15' },
    ]);
  });

  it('drops the note field first when the serialized payload exceeds the URL length cap', () => {
    const longNote = 'a'.repeat(9000);
    const url = buildInlineCreateUrl({
      condition,
      initialValues: [
        { fieldCode: 'start', value: '2026-07-14' },
        { fieldCode: 'note', value: longNote },
      ],
    });

    const search = new URLSearchParams(url.split('?')[1]);
    const values = JSON.parse(search.get('calendar_inline_create_values')!);
    expect(values).toEqual([{ fieldCode: 'start', value: '2026-07-14' }]);
  });
});

describe('isInlineEditPage / isInlineCreatePage', () => {
  it('detects the marker query params', () => {
    setLocation('https://example.cybozu.com/k/1/show?calendar_inline_edit=1');
    expect(isInlineEditPage()).toBe(true);
    expect(isInlineCreatePage()).toBe(false);

    setLocation('https://example.cybozu.com/k/1/edit?calendar_inline_create=1');
    expect(isInlineCreatePage()).toBe(true);
    expect(isInlineEditPage()).toBe(false);
  });
});

describe('applyInlineCreateInitialValues', () => {
  const buildEvent = () => ({
    record: {
      title: { value: '' },
      start: { value: '' },
      end: { value: '' },
      allDayField: { value: [] },
      note: { value: '' },
      category: { value: '' },
      recurrence: { value: '' },
      other: { value: '' },
    },
  });

  it('is a no-op outside an inline-create page', () => {
    setLocation('https://example.cybozu.com/k/1/edit');
    const event = buildEvent();
    applyInlineCreateInitialValues(event);
    expect(event.record.title.value).toBe('');
  });

  it('applies only allowlisted, validated fields from the query param', () => {
    const values = [
      { fieldCode: 'title', value: 'hello' },
      { fieldCode: 'start', value: '2026-07-14' },
      { fieldCode: 'end', value: '2026-07-14T10:00:00+09:00' },
      { fieldCode: 'allDayField', value: ['allDay'] },
      { fieldCode: 'recurrence', value: '' },
      // not in the condition's field mapping at all -> must be ignored
      { fieldCode: 'other', value: 'should not apply' },
    ];
    setLocation(
      `https://example.cybozu.com/k/1/edit?calendar_inline_create=1&calendar_inline_create_condition=condition-1&calendar_inline_create_values=${encodeURIComponent(JSON.stringify(values))}`
    );

    const event = buildEvent();
    applyInlineCreateInitialValues(event);

    expect(event.record.title.value).toBe('hello');
    expect(event.record.start.value).toBe('2026-07-14');
    expect(event.record.end.value).toBe('2026-07-14T10:00:00+09:00');
    expect(event.record.allDayField.value).toEqual(['allDay']);
    expect(event.record.recurrence.value).toBe('');
    expect(event.record.other.value).toBe('');
  });

  it('rejects a malformed date value for a date field', () => {
    const values = [{ fieldCode: 'start', value: 'not-a-date' }];
    setLocation(
      `https://example.cybozu.com/k/1/edit?calendar_inline_create=1&calendar_inline_create_condition=condition-1&calendar_inline_create_values=${encodeURIComponent(JSON.stringify(values))}`
    );

    const event = buildEvent();
    applyInlineCreateInitialValues(event);
    expect(event.record.start.value).toBe('');
  });

  it('rejects an oversized values payload', () => {
    const values = [{ fieldCode: 'title', value: 'a'.repeat(9000) }];
    setLocation(
      `https://example.cybozu.com/k/1/edit?calendar_inline_create=1&calendar_inline_create_condition=condition-1&calendar_inline_create_values=${encodeURIComponent(JSON.stringify(values))}`
    );

    const event = buildEvent();
    applyInlineCreateInitialValues(event);
    expect(event.record.title.value).toBe('');
  });

  it('rejects a malformed JSON payload without throwing', () => {
    setLocation(
      'https://example.cybozu.com/k/1/edit?calendar_inline_create=1&calendar_inline_create_condition=condition-1&calendar_inline_create_values=not-json'
    );

    const event = buildEvent();
    expect(() => applyInlineCreateInitialValues(event)).not.toThrow();
    expect(event.record.title.value).toBe('');
  });
});
