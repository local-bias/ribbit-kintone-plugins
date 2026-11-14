import { PROXY_MANAGED_API_KEY, type ProxyEndpoint } from './endpoint';

/**
 * AI SDKのプロバイダーへ渡す、kintoneのproxy経由の`fetch`
 *
 * - 送信先がproxy設定に登録したURLと完全一致し、POSTでなければ通信前に拒否する
 *   (proxy設定は前方一致で認証ヘッダーを付けるため、本プラグインの誤実装で別のURLへキーを送らない)
 * - `ketch`も`kintone.plugin.app.proxy`も`AbortSignal`を読まないため、中断とタイムアウトはここで行う。
 *   止まるのは待機だけで、送信済みのリクエストは完走し課金される
 * - `ketch`が`new Response()`で投げる例外(204や範囲外のstatus)と3xxを、表示用のエラーにする
 *
 * @see docs/07b-ai-providers.md 3章・7章
 */

export type ProxyFetchErrorKind =
  /** 登録した送信先・メソッドと一致しない */
  | 'blocked'
  /** リダイレクト(最終的な送信先を検証できない) */
  | 'redirect'
  /** 本文の無い応答や、解釈できないstatus */
  | 'invalid-response'
  /** proxyの呼び出し自体が失敗した */
  | 'network'
  | 'timeout';

export class ProxyFetchError extends Error {
  override name = 'ProxyFetchError';
  constructor(
    readonly kind: ProxyFetchErrorKind,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
  }
}

/** `ketch`と同じ形(URL文字列とRequestInitだけを読む) */
export type ProxyFetch = (url: string, init: RequestInit) => Promise<Response>;

/** proxyのタイムアウトは公式に記載がないため、待つ上限を持つ。P-1の実測で調整する */
export const AI_REQUEST_TIMEOUT_MS = 90_000;

type NormalizedRequest = { url: URL; method: string; headers: Headers; body: string | undefined };

const normalizeRequest = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined
): Promise<NormalizedRequest> => {
  if (input instanceof Request) {
    const request = init === undefined ? input : new Request(input, init);
    return {
      url: new URL(request.url),
      method: request.method.toUpperCase(),
      headers: request.headers,
      body: request.body === null ? undefined : await request.clone().text(),
    };
  }
  const body = init?.body;
  if (body !== undefined && body !== null && typeof body !== 'string') {
    // AI SDKのプロバイダーはJSON文字列を送る。それ以外の本文はproxyへ文字列として渡せない
    throw new ProxyFetchError('blocked', 'Unsupported request body');
  }
  return {
    url: new URL(String(input)),
    method: (init?.method ?? 'GET').toUpperCase(),
    headers: new Headers(init?.headers),
    body: body ?? undefined,
  };
};

const assertAllowed = (request: NormalizedRequest, endpoint: ProxyEndpoint): void => {
  const { url } = request;
  // `href`の完全一致で、末尾だけの`?`や`#`も通さない
  const allowed =
    url.href === endpoint.url &&
    url.protocol === 'https:' &&
    url.username === '' &&
    url.password === '' &&
    url.hash === '' &&
    url.origin === endpoint.origin &&
    url.pathname === endpoint.pathname &&
    url.search === endpoint.search &&
    request.method === endpoint.method;
  if (!allowed) {
    // 送信先はログに出さない(クエリに値が載りうる)。原因の切り分けには種類だけで足りる
    throw new ProxyFetchError('blocked', 'The request does not match the registered AI endpoint');
  }
};

/** signalが中断されたら、その理由でrejectするPromise */
const whenAborted = (signal: AbortSignal | null | undefined): Promise<never> =>
  new Promise((_, reject) => {
    if (!signal) return;
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });

/**
 * proxyへ渡すヘッダー。プロバイダーがsentinelのAPIキーで作った認証ヘッダーを取り除く
 *
 * 認証ヘッダーはkintoneがproxy設定から付ける。ketchはヘッダー名を小文字にするため、保存済みの名前
 * (`Authorization`など)との大文字小文字の違いで両方が送られることのないよう、上書きに頼らず消しておく
 */
const toProxyHeaders = (headers: Headers): Headers => {
  const next = new Headers();
  headers.forEach((value, name) => {
    if (!value.includes(PROXY_MANAGED_API_KEY)) next.set(name, value);
  });
  return next;
};

export const createRestrictedProxyFetch = (params: {
  endpoint: ProxyEndpoint;
  proxyFetch: ProxyFetch;
  timeoutMs?: number;
  setTimer?: (callback: () => void, ms: number) => () => void;
}): typeof globalThis.fetch => {
  const { endpoint, proxyFetch, timeoutMs = AI_REQUEST_TIMEOUT_MS } = params;
  const setTimer =
    params.setTimer ??
    ((callback, ms) => {
      const id = setTimeout(callback, ms);
      return () => clearTimeout(id);
    });

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = await normalizeRequest(input, init);
    assertAllowed(request, endpoint);
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    signal?.throwIfAborted();

    let cancelTimer = () => {};
    const timeout = new Promise<never>((_, reject) => {
      cancelTimer = setTimer(
        () => reject(new ProxyFetchError('timeout', 'The AI request timed out')),
        timeoutMs
      );
    });
    const call = (async () => {
      try {
        return await proxyFetch(request.url.href, {
          method: request.method,
          headers: toProxyHeaders(request.headers),
          body: request.body,
        });
      } catch (error) {
        // `ketch`は204/304などで`new Response()`がTypeError、範囲外のstatusでRangeErrorを投げる
        if (error instanceof TypeError || error instanceof RangeError) {
          throw new ProxyFetchError(
            'invalid-response',
            'The AI returned an empty or invalid response',
            {
              cause: error,
            }
          );
        }
        throw new ProxyFetchError('network', 'Could not reach the AI through the kintone proxy', {
          cause: error,
        });
      }
    })();

    try {
      // 中断・タイムアウトの後に届いた応答は、競争に負けて捨てられる
      const response = await Promise.race([call, whenAborted(signal), timeout]);
      if (response.status >= 300 && response.status < 400) {
        throw new ProxyFetchError('redirect', 'The AI endpoint returned a redirect');
      }
      return response;
    } finally {
      cancelTimer();
      // 負けた側の失敗を未処理のrejectionにしない
      call.catch(() => {});
    }
  }) as typeof globalThis.fetch;
};
