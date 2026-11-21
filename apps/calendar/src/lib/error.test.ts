import { describe, expect, it } from 'vitest';
import { isRecordNotFoundError } from './error';

describe('isRecordNotFoundError', () => {
  it('detects the kintone REST API error for a missing (deleted) record', () => {
    expect(
      isRecordNotFoundError({
        code: 'GAIA_RE01',
        id: 'x',
        message: '指定したレコードが見つかりません。',
      })
    ).toBe(true);
  });

  it('does not treat other errors as a missing record', () => {
    expect(isRecordNotFoundError({ code: 'CB_NO02', message: 'no permission' })).toBe(false);
    expect(isRecordNotFoundError(new Error('network error'))).toBe(false);
    expect(isRecordNotFoundError('GAIA_RE01')).toBe(false);
    expect(isRecordNotFoundError(null)).toBe(false);
    expect(isRecordNotFoundError(undefined)).toBe(false);
  });
});
