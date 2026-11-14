import { describe, expect, test } from 'vitest';
import { NO_ACCESS } from './asset-access';
import { decideToggle } from './asset-toggle';

const editable = { ...NO_ACCESS, canToggleStatus: true, unavailable: false };
const readOnly = { ...NO_ACCESS, canToggleStatus: false, unavailable: false };
const unavailable = { ...NO_ACCESS, canToggleStatus: false, unavailable: true };

describe('decideToggle', () => {
  test.each([
    // 有効(レコード), ローカル無効, 権限, 結果
    [true, false, editable, { type: 'update-record', enabled: false, unmute: false }],
    [true, false, readOnly, { type: 'mute' }],
    [true, false, unavailable, { type: 'mute' }],
    [true, true, readOnly, { type: 'unmute' }],
    [true, true, editable, { type: 'unmute' }],
    [false, false, editable, { type: 'update-record', enabled: true, unmute: false }],
    [false, true, editable, { type: 'update-record', enabled: true, unmute: true }],
    [false, false, readOnly, { type: 'forbidden', reason: 'no-permission' }],
    [false, false, unavailable, { type: 'forbidden', reason: 'unavailable' }],
  ] as const)('有効=%s / ローカル無効=%s / %o -> %o', (enabled, muted, access, expected) => {
    expect(decideToggle({ enabled, muted, access })).toEqual(expected);
  });
});
