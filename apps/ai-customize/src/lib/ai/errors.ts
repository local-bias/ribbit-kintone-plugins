import {
  APICallError,
  InvalidToolApprovalError,
  InvalidToolInputError,
  MissingToolResultsError,
  NoContentGeneratedError,
  NoSuchToolError,
  RetryError,
  ToolCallNotFoundForApprovalError,
} from 'ai';
import { ProxyFetchError } from './proxy-fetch';

/**
 * AI呼び出しの失敗を、画面に出す判別共用体へ変換します(純粋関数)
 *
 * 生レスポンスや認証ヘッダーは表示にもログにも出さない。プロバイダーのエラーメッセージは
 * 原因の切り分けに要るため、長さを切り詰めて添える
 *
 * @see docs/07-ai-tools.md 7章、docs/07b-ai-providers.md 8章
 */

export type AiErrorKind =
  | 'auth'
  | 'rate-limit'
  | 'timeout'
  | 'network'
  | 'aborted'
  | 'not-found'
  | 'bad-request'
  /** モデルがツール呼び出しに対応していない */
  | 'tool-unsupported'
  /** 会話が長すぎて、モデルの文脈長を超えた */
  | 'context-length'
  /** 本プラグインの履歴の組み立ての不具合(承認とツール結果の対応など) */
  | 'internal'
  | 'server'
  | 'invalid-tool-input'
  | 'blocked-request'
  | 'empty-response'
  | 'unknown';

export type AiError = {
  kind: AiErrorKind;
  /** 利用者が再試行してよい(書き込みを伴う再試行は自動では行わない) */
  retryable: boolean;
  /** 原因の切り分けに使う短い説明(プロバイダーのメッセージなど) */
  detail: string;
};

const MAX_DETAIL_LENGTH = 200;

const shorten = (value: string): string =>
  value.length > MAX_DETAIL_LENGTH ? `${value.slice(0, MAX_DETAIL_LENGTH)}…` : value;

const fromStatus = (status: number | undefined): Pick<AiError, 'kind' | 'retryable'> => {
  if (status === 401 || status === 403) return { kind: 'auth', retryable: false };
  if (status === 404) return { kind: 'not-found', retryable: false };
  if (status === 408) return { kind: 'timeout', retryable: true };
  if (status === 429) return { kind: 'rate-limit', retryable: true };
  if (status !== undefined && status >= 500) return { kind: 'server', retryable: true };
  if (status !== undefined && status >= 400) return { kind: 'bad-request', retryable: false };
  return { kind: 'unknown', retryable: false };
};

const TOOL_UNSUPPORTED = /tool.*(not|un)\s*support|support.*tool|does not support (function|tool)/i;
const CONTEXT_LENGTH =
  /context.?(length|window)|maximum context|too many tokens|prompt is too long|input is too long|token limit/i;

/**
 * プロバイダーのエラーを分類します
 *
 * 認証エラーの説明はAPIキーの一部を含みうるため、利用者には出さない
 */
const fromApiCallError = (error: APICallError): AiError => {
  const status = error.statusCode;
  const message = error.message;
  if (status === 401 || status === 403) {
    return { kind: 'auth', retryable: false, detail: '' };
  }
  if ((status === 400 || status === 404) && TOOL_UNSUPPORTED.test(message)) {
    return { kind: 'tool-unsupported', retryable: false, detail: shorten(message) };
  }
  if ((status === 400 || status === 413) && CONTEXT_LENGTH.test(message)) {
    return { kind: 'context-length', retryable: false, detail: '' };
  }
  return { ...fromStatus(status), detail: shorten(message) };
};

const isAbort = (error: unknown): boolean =>
  (error instanceof Error || error instanceof DOMException) && error.name === 'AbortError';

export const classifyAiError = (error: unknown): AiError => {
  if (RetryError.isInstance(error)) {
    return classifyAiError(error.lastError);
  }
  if (isAbort(error)) {
    return { kind: 'aborted', retryable: true, detail: '' };
  }
  if (error instanceof ProxyFetchError) {
    switch (error.kind) {
      case 'timeout':
        return { kind: 'timeout', retryable: true, detail: '' };
      case 'network':
        return { kind: 'network', retryable: true, detail: '' };
      case 'invalid-response':
        return { kind: 'empty-response', retryable: true, detail: '' };
      case 'blocked':
      case 'redirect':
        return { kind: 'blocked-request', retryable: false, detail: error.kind };
    }
  }
  if (APICallError.isInstance(error)) {
    // 原因(ProxyFetchErrorや中断)が包まれていれば、そちらで判定する
    if (error.cause instanceof ProxyFetchError || isAbort(error.cause)) {
      return classifyAiError(error.cause);
    }
    return fromApiCallError(error);
  }
  if (InvalidToolInputError.isInstance(error) || NoSuchToolError.isInstance(error)) {
    return { kind: 'invalid-tool-input', retryable: true, detail: shorten(error.message) };
  }
  if (
    MissingToolResultsError.isInstance(error) ||
    InvalidToolApprovalError.isInstance(error) ||
    ToolCallNotFoundForApprovalError.isInstance(error)
  ) {
    // 履歴の組み立ての不具合。利用者には汎用の文言だけを出し、原因は開発者向けに残す
    console.error('[ai-customize]', error);
    return { kind: 'internal', retryable: false, detail: '' };
  }
  if (NoContentGeneratedError.isInstance(error)) {
    return { kind: 'empty-response', retryable: true, detail: '' };
  }
  return {
    kind: 'unknown',
    retryable: false,
    detail: shorten(error instanceof Error ? error.message : String(error)),
  };
};
