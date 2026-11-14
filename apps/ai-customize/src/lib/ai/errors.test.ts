import { APICallError, InvalidToolInputError, RetryError } from 'ai';
import { describe, expect, test } from 'vitest';
import { classifyAiError } from './errors';
import { ProxyFetchError } from './proxy-fetch';

const apiError = (statusCode: number, message = 'provider message') =>
  new APICallError({ message, url: 'https://api.example.com', requestBodyValues: {}, statusCode });

describe('classifyAiError', () => {
  test.each([
    [401, 'auth', false],
    [403, 'auth', false],
    [404, 'not-found', false],
    [429, 'rate-limit', true],
    [500, 'server', true],
    [400, 'bad-request', false],
  ])('HTTP %i は %s(再試行 %s)', (status, kind, retryable) => {
    expect(classifyAiError(apiError(status))).toMatchObject({ kind, retryable });
  });

  test('proxy経由の失敗は、包まれていても原因で分類する', () => {
    const timeout = new ProxyFetchError('timeout', 'x');
    expect(classifyAiError(timeout)).toMatchObject({ kind: 'timeout', retryable: true });
    const wrapped = new APICallError({
      message: 'fetch failed',
      url: 'https://api.example.com',
      requestBodyValues: {},
      cause: new ProxyFetchError('blocked', 'x'),
    });
    expect(classifyAiError(wrapped)).toMatchObject({ kind: 'blocked-request', retryable: false });
    expect(classifyAiError(new ProxyFetchError('invalid-response', 'x')).kind).toBe(
      'empty-response'
    );
  });

  test('中断と、再試行の末の失敗', () => {
    expect(classifyAiError(new DOMException('stop', 'AbortError')).kind).toBe('aborted');
    const retry = new RetryError({
      message: 'x',
      reason: 'maxRetriesExceeded',
      errors: [apiError(429)],
    });
    expect(classifyAiError(retry).kind).toBe('rate-limit');
  });

  test('ツール入力の不一致と未知のエラー。長い説明は切り詰める', () => {
    const invalid = new InvalidToolInputError({
      toolName: 'x',
      toolInput: '{}',
      cause: new Error('bad'),
    });
    expect(classifyAiError(invalid).kind).toBe('invalid-tool-input');
    const unknown = classifyAiError(new Error('a'.repeat(500)));
    expect(unknown.kind).toBe('unknown');
    expect(unknown.detail.length).toBeLessThanOrEqual(201);
  });
});

describe('classifyAiError(プロバイダーのメッセージ)', () => {
  test('認証エラーはAPIキーの一部を含みうるため、説明を出さない', () => {
    const error = classifyAiError(apiError(401, 'Incorrect API key provided: sk-proj-****abcd'));
    expect(error).toEqual({ kind: 'auth', retryable: false, detail: '' });
  });

  test('ツール呼び出し非対応と文脈長超過を見分ける', () => {
    expect(classifyAiError(apiError(404, 'No endpoints found that support tool use')).kind).toBe(
      'tool-unsupported'
    );
    expect(
      classifyAiError(apiError(400, "This model's maximum context length is 128000 tokens")).kind
    ).toBe('context-length');
    expect(classifyAiError(apiError(400, 'invalid temperature')).kind).toBe('bad-request');
  });
});
