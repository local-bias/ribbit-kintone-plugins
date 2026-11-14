import { describe, expect, test, vi } from 'vitest';
import { createDiagnostics, summarizeDiagnostics } from './diagnostics';

describe('createDiagnostics', () => {
  test('記録を保持し、onRecord へ渡す', () => {
    const onRecord = vi.fn();
    const diagnostics = createDiagnostics({ circuitBreakerThreshold: 3, onRecord });
    diagnostics.record({ kind: 'gate-timeout' });
    expect(diagnostics.entries()).toEqual([{ kind: 'gate-timeout' }]);
    expect(onRecord).toHaveBeenCalledWith({ kind: 'gate-timeout' });
  });

  test('同一アセットのハンドラ例外が閾値に達したら止める', () => {
    const diagnostics = createDiagnostics({ circuitBreakerThreshold: 3, onRecord: vi.fn() });
    const fail = (assetId: string) =>
      diagnostics.record({
        kind: 'handler-failed',
        assetId,
        eventType: 'app.record.edit.change.A',
        error: new Error('x'),
      });
    fail('1');
    fail('1');
    fail('2');
    expect(diagnostics.isSuspended('1')).toBe(false);
    fail('1');
    expect(diagnostics.isSuspended('1')).toBe(true);
    expect(diagnostics.isSuspended('2')).toBe(false);
    fail('1');
    expect(diagnostics.entries().filter((entry) => entry.kind === 'suspended')).toHaveLength(1);
  });
});

describe('summarizeDiagnostics', () => {
  test('アセット単位で重複を除いて数える', () => {
    const summary = summarizeDiagnostics([
      { kind: 'evaluation-failed', assetId: '1', error: null },
      { kind: 'handler-failed', assetId: '1', eventType: 'x', error: null },
      {
        kind: 'permission-denied',
        denial: {
          assetId: '2',
          operation: 'kintone.api',
          required: ['put'],
          method: 'PUT',
          target: null,
        },
      },
      {
        kind: 'blocked',
        assetId: '3',
        policy: { allowed: false, reason: 'bypass', details: [] },
      },
    ]);
    expect(summary).toEqual({
      failedAssetIds: ['1'],
      deniedAssetIds: ['2'],
      blockedAssetIds: ['3'],
    });
  });
});
