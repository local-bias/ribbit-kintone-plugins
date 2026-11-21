import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnyPluginConfig, PluginCondition } from '@/schema/plugin-config';

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
  initialView: 'dayGridMonth' as const,
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
    backgroundEventField: '',
    sortField: '',
    assigneeField: '',
  },
  id: 'condition-1',
  daysOfWeek: [1, 2, 3, 4, 5] as PluginCondition['daysOfWeek'],
  firstDay: 0,
  enablesRecurrence: true,
  editMode: 'detailed' as const,
  slotDuration: '00:30:00',
  scrollsToNow: false,
  visibleViews: [],
  enablesDragAndDrop: true,
  confirmsReschedule: false,
  preventsOverlap: false,
  showsLegend: false,
  enablesBackgroundEvent: false,
  backgroundEventOption: '',
  sortOrder: 'asc' as const,
};

const storedConfig: AnyPluginConfig = {
  version: 8,
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

/** `kintone.buildPageUrl`(テスト環境には存在しない)を差し替える。`undefined`で未提供の環境を再現する */
const setBuildPageUrl = (impl: ((page: string, params: object) => Promise<string>) | undefined) => {
  (globalThis.kintone as { buildPageUrl?: unknown }).buildPageUrl = impl;
};

beforeEach(() => {
  setLocation('https://example.cybozu.com/k/1/');
});

afterEach(() => {
  setBuildPageUrl(undefined);
});

const {
  buildInlineEditUrl,
  buildInlineCreateUrl,
  applyInlineCreateInitialValues,
  isInlineCreatePage,
  isInlineEditPage,
  CALENDAR_INLINE_CREATE_PARAM,
  CALENDAR_INLINE_EDIT_PARAM,
  shouldUseDetailedEditMode,
  canBuildMobilePageUrl,
  buildMobileInlineEditUrl,
  buildMobileInlineCreateUrl,
  INLINE_FRAME_NAME,
  isInlineEditFrame,
  isInlineCreateFrame,
  shouldTreatDetailShowAsEditCancel,
} = await import('./inline-record');

describe('isInlineEditFrame / isInlineCreateFrame', () => {
  afterEach(() => {
    window.name = '';
  });

  it('detects the frame from the marker query param on the initial URL', () => {
    setLocation('https://example.cybozu.com/k/m/1/show?record=1&calendar_inline_edit=1');
    expect(isInlineEditFrame()).toBe(true);
    expect(isInlineCreateFrame()).toBe(false);
  });

  it('keeps detecting the frame by its name after navigating to a URL without the marker', () => {
    setLocation('https://example.cybozu.com/k/m/1/show?record=1');
    expect(isInlineEditFrame()).toBe(false);

    window.name = INLINE_FRAME_NAME.edit;
    expect(isInlineEditFrame()).toBe(true);
    expect(isInlineCreateFrame()).toBe(false);

    window.name = INLINE_FRAME_NAME.create;
    expect(isInlineCreateFrame()).toBe(true);
    expect(isInlineEditFrame()).toBe(false);
  });
});

describe('shouldTreatDetailShowAsEditCancel', () => {
  it('ignores a detail screen shown before the edit screen on the initial URL', () => {
    expect(
      shouldTreatDetailShowAsEditCancel({ hasShownEditScreen: false, isOnInitialInlineUrl: true })
    ).toBe(false);
  });

  it('treats a detail screen after the edit screen as a cancel', () => {
    expect(
      shouldTreatDetailShowAsEditCancel({ hasShownEditScreen: true, isOnInitialInlineUrl: true })
    ).toBe(true);
  });

  it('treats a detail screen after leaving the initial URL as a cancel', () => {
    expect(
      shouldTreatDetailShowAsEditCancel({ hasShownEditScreen: false, isOnInitialInlineUrl: false })
    ).toBe(true);
  });
});

describe('shouldUseDetailedEditMode', () => {
  it('uses the detailed (iframe) edit mode on desktop when configured', () => {
    expect(
      shouldUseDetailedEditMode({ editMode: 'detailed', isMobile: false, canBuildMobilePageUrl: false })
    ).toBe(true);
  });

  it('uses the detailed edit mode on mobile when the mobile page URL can be built', () => {
    expect(
      shouldUseDetailedEditMode({ editMode: 'detailed', isMobile: true, canBuildMobilePageUrl: true })
    ).toBe(true);
  });

  it('falls back to the simple dialog on mobile when kintone.buildPageUrl is unavailable', () => {
    // PC版のURLをモバイルで開くとkintoneがCB_VA01エラーを表示するため、モバイル版のURLを
    // 組み立てられない環境では簡易編集にフォールバックする
    expect(
      shouldUseDetailedEditMode({ editMode: 'detailed', isMobile: true, canBuildMobilePageUrl: false })
    ).toBe(false);
  });

  it('never uses the detailed edit mode when simple mode or no mode is configured', () => {
    expect(
      shouldUseDetailedEditMode({ editMode: 'simple', isMobile: true, canBuildMobilePageUrl: true })
    ).toBe(false);
    expect(
      shouldUseDetailedEditMode({ editMode: undefined, isMobile: false, canBuildMobilePageUrl: true })
    ).toBe(false);
  });
});

describe('canBuildMobilePageUrl', () => {
  it('reports whether kintone.buildPageUrl exists', () => {
    expect(canBuildMobilePageUrl()).toBe(false);
    setBuildPageUrl(async () => '');
    expect(canBuildMobilePageUrl()).toBe(true);
  });
});

describe('buildMobileInlineEditUrl', () => {
  it('requests the mobile edit page URL and appends the inline-edit marker', async () => {
    const buildPageUrl = vi.fn(
      async () => 'https://example.cybozu.com/k/m/1/show?record=42#mode=edit'
    );
    setBuildPageUrl(buildPageUrl);

    const url = await buildMobileInlineEditUrl({ appId: '1', recordId: '42' });

    expect(buildPageUrl).toHaveBeenCalledWith('APP_EDIT_MOBILE', { appId: '1', recordId: '42' });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/k/m/1/show');
    expect(parsed.searchParams.get('record')).toBe('42');
    expect(parsed.searchParams.get(CALENDAR_INLINE_EDIT_PARAM)).toBe('1');
    expect(parsed.hash).toBe('#mode=edit');
  });

  it('resolves a relative URL against the current origin', async () => {
    setBuildPageUrl(async () => '/k/m/1/show?record=42#mode=edit');
    const url = await buildMobileInlineEditUrl({ appId: '1', recordId: '42' });
    expect(new URL(url).origin).toBe('https://example.cybozu.com');
  });

  it('rejects a URL on a different origin', async () => {
    setBuildPageUrl(async () => 'https://evil.example.com/k/m/1/show?record=42');
    await expect(buildMobileInlineEditUrl({ appId: '1', recordId: '42' })).rejects.toThrow();
  });

  it('rejects when kintone.buildPageUrl is unavailable', async () => {
    await expect(buildMobileInlineEditUrl({ appId: '1', recordId: '42' })).rejects.toThrow();
  });
});

describe('buildMobileInlineCreateUrl', () => {
  it('requests the mobile create page URL and carries the initial values', async () => {
    const buildPageUrl = vi.fn(async () => 'https://example.cybozu.com/k/m/1/edit');
    setBuildPageUrl(buildPageUrl);

    const url = await buildMobileInlineCreateUrl({
      appId: '1',
      condition,
      initialValues: [{ fieldCode: 'start', value: '2026-07-14' }],
    });

    expect(buildPageUrl).toHaveBeenCalledWith('APP_CREATE_MOBILE', { appId: '1' });
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/k/m/1/edit');
    expect(parsed.searchParams.get(CALENDAR_INLINE_CREATE_PARAM)).toBe('1');
    expect(parsed.searchParams.get('calendar_inline_create_condition')).toBe('condition-1');
    expect(JSON.parse(parsed.searchParams.get('calendar_inline_create_values')!)).toEqual([
      { fieldCode: 'start', value: '2026-07-14' },
    ]);
  });
});

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
