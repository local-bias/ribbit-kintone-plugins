import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, it } from 'vitest';
import {
  buildCopiedEvent,
  fieldValueToText,
  getDisplayTitle,
  getSortValue,
  isBackgroundEventAvailable,
  isBackgroundRecord,
} from './event-field-values';

const record = (fields: Record<string, { type: string; value: unknown }>) =>
  fields as unknown as kintoneAPI.RecordData;

describe('fieldValueToText', () => {
  it('returns plain string values as is', () => {
    expect(fieldValueToText({ type: 'SINGLE_LINE_TEXT', value: '会議' })).toBe('会議');
    expect(fieldValueToText({ type: 'CALC', value: '10' })).toBe('10');
  });

  it('strips tags and decodes entities from rich text', () => {
    expect(
      fieldValueToText({ type: 'RICH_TEXT', value: '<div>A &amp; B</div><div>&lt;C&gt;</div>' })
    ).toBe('A & B <C>');
  });

  it('joins multiple values', () => {
    expect(fieldValueToText({ type: 'CHECK_BOX', value: ['A', 'B'] })).toBe('A, B');
  });

  it('returns undefined for empty values', () => {
    expect(fieldValueToText(undefined)).toBeUndefined();
    expect(fieldValueToText({ type: 'SINGLE_LINE_TEXT', value: '' })).toBeUndefined();
    expect(fieldValueToText({ type: 'CHECK_BOX', value: [] })).toBeUndefined();
  });
});

describe('getDisplayTitle', () => {
  it('returns undefined when no display title field is configured', () => {
    expect(
      getDisplayTitle({
        record: record({}),
        fieldCode: '',
        fieldExists: false,
        noPermissionLabel: 'x',
      })
    ).toBeUndefined();
  });

  it('returns the formatted field value', () => {
    expect(
      getDisplayTitle({
        record: record({ display: { type: 'CALC', value: '定例 10:00' } }),
        fieldCode: 'display',
        fieldExists: true,
        noPermissionLabel: 'x',
      })
    ).toBe('定例 10:00');
  });

  it('returns the no-permission label when the field is missing from the response', () => {
    // REST APIのレスポンスには、閲覧権限のないフィールドが含まれない
    expect(
      getDisplayTitle({
        record: record({}),
        fieldCode: 'display',
        fieldExists: true,
        noPermissionLabel: '権限なし',
      })
    ).toBe('権限なし');
  });

  it('falls back to the input title when the field no longer exists in the app', () => {
    expect(
      getDisplayTitle({
        record: record({}),
        fieldCode: 'deleted',
        fieldExists: false,
        noPermissionLabel: '権限なし',
      })
    ).toBeUndefined();
  });
});

describe('getSortValue', () => {
  const dropdown = {
    type: 'DROP_DOWN',
    code: 'priority',
    label: 'priority',
    options: {
      高: { label: '高', index: '0' },
      中: { label: '中', index: '1' },
      低: { label: '低', index: '2' },
    },
  } as unknown as kintoneAPI.FieldProperty;

  it('returns null when no sort field is configured or the value is empty', () => {
    expect(getSortValue({ record: record({}), fieldCode: '', property: undefined })).toBeNull();
    expect(
      getSortValue({
        record: record({ n: { type: 'NUMBER', value: '' } }),
        fieldCode: 'n',
        property: undefined,
      })
    ).toBeNull();
  });

  it('compares numbers numerically', () => {
    expect(
      getSortValue({
        record: record({ n: { type: 'NUMBER', value: '10' } }),
        fieldCode: 'n',
        property: undefined,
      })
    ).toBe(10);
  });

  it('uses the option order for selection fields', () => {
    expect(
      getSortValue({
        record: record({ priority: { type: 'DROP_DOWN', value: '低' } }),
        fieldCode: 'priority',
        property: dropdown,
      })
    ).toBe(2);
    expect(
      getSortValue({
        record: record({ priority: { type: 'DROP_DOWN', value: '高' } }),
        fieldCode: 'priority',
        property: dropdown,
      })
    ).toBe(0);
  });

  it('compares numeric calculated fields numerically', () => {
    const calc = {
      type: 'CALC',
      code: 'c',
      label: 'c',
      format: 'NUMBER',
    } as unknown as kintoneAPI.FieldProperty;
    expect(
      getSortValue({
        record: record({ c: { type: 'CALC', value: '10' } }),
        fieldCode: 'c',
        property: calc,
      })
    ).toBe(10);
  });

  it('falls back to the string value', () => {
    expect(
      getSortValue({
        record: record({ s: { type: 'SINGLE_LINE_TEXT', value: 'abc' } }),
        fieldCode: 's',
        property: undefined,
      })
    ).toBe('abc');
    expect(
      getSortValue({
        record: record({ c: { type: 'CALC', value: '2026-11-16' } }),
        fieldCode: 'c',
        property: undefined,
      })
    ).toBe('2026-11-16');
  });
});

describe('isBackgroundRecord', () => {
  it('is true only when the configured option is checked', () => {
    const fields = record({ bg: { type: 'CHECK_BOX', value: ['背景'] } });
    expect(isBackgroundRecord({ record: fields, fieldCode: 'bg', option: '背景' })).toBe(true);
    expect(isBackgroundRecord({ record: fields, fieldCode: 'bg', option: '他' })).toBe(false);
    expect(isBackgroundRecord({ record: fields, fieldCode: '', option: '背景' })).toBe(false);
    expect(isBackgroundRecord({ record: fields, fieldCode: 'bg', option: '' })).toBe(false);
  });
});

describe('isBackgroundEventAvailable', () => {
  const checkbox = {
    type: 'CHECK_BOX',
    code: 'bg',
    label: 'bg',
    options: { 背景: { label: '背景', index: '0' } },
  } as unknown as kintoneAPI.FieldProperty;
  const base = { enablesBackgroundEvent: true, backgroundEventOption: '背景' };

  it('is true when the option exists in the checkbox field', () => {
    expect(isBackgroundEventAvailable({ ...base, property: checkbox })).toBe(true);
  });

  it('is false when disabled, unset, or the option no longer exists', () => {
    expect(
      isBackgroundEventAvailable({ ...base, enablesBackgroundEvent: false, property: checkbox })
    ).toBe(false);
    expect(isBackgroundEventAvailable({ ...base, property: undefined })).toBe(false);
    expect(
      isBackgroundEventAvailable({ ...base, backgroundEventOption: '削除済み', property: checkbox })
    ).toBe(false);
    expect(
      isBackgroundEventAvailable({
        ...base,
        property: { type: 'DROP_DOWN', code: 'bg', label: 'bg', options: {} } as never,
      })
    ).toBe(false);
  });
});

describe('buildCopiedEvent', () => {
  it('does not carry over the assignees, which kintone decides for the new record', () => {
    const copied = buildCopiedEvent(
      { id: '1', title: '会議', assignees: [{ key: 'a', label: 'A', isUser: true }] },
      ''
    );
    expect(copied.assignees).toBeUndefined();
  });

  it('drops the record id and appends the suffix to the title', () => {
    const copied = buildCopiedEvent({ id: '1', title: '会議', note: 'memo' }, ' (copy)');
    expect(copied.id).toBeUndefined();
    expect(copied.title).toBe('会議 (copy)');
    expect(copied.note).toBe('memo');
  });

  it('copies a recurring series without the occurrences detached from the original', () => {
    const copied = buildCopiedEvent(
      {
        id: '1',
        title: '定例',
        extendedProps: {
          recurrence: { kind: 'master', rrule: 'FREQ=WEEKLY', exceptions: ['2026-11-16T10:00:00'] },
        },
      },
      ''
    );
    expect(copied.extendedProps?.recurrence).toEqual({
      kind: 'master',
      rrule: 'FREQ=WEEKLY',
      exceptions: [],
    });
  });

  it('copies a detached occurrence as a standalone event', () => {
    const copied = buildCopiedEvent(
      {
        id: '2',
        title: '定例',
        extendedProps: {
          recurrence: { kind: 'override', masterId: '1', originalStart: '2026-11-16T10:00:00' },
        },
      },
      ''
    );
    expect(copied.extendedProps?.recurrence).toBeUndefined();
  });
});
