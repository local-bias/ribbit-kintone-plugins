import jsTokens, { type Token } from 'js-tokens';

/**
 * アセットのコードを静的に走査し、権限の使用箇所と迂回パターンを検出します
 *
 * 文字列・コメント・正規表現リテラルを区別するためにトークナイザーを使う。
 * 正規表現を生のコードへ当てると、コメント中の`fetch(`で誤検知し、文字列連結で見逃すため。
 *
 * 検出は「うっかり」を止めるためのもので、悪意ある難読化は止められない(docs/13 3-1章)。
 */

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'unknown';

export type JsCapabilityUsage = {
  /** `kintone.api(...)`の呼び出し。メソッドがリテラルでなければ`unknown` */
  apiCalls: { method: ApiMethod; path: string | null; line: number }[];
  /** `kintone.proxy(...)` / `kintone.proxy.upload(...)`。送信先がリテラルでなければ`target: null` */
  external: { target: string | null; line: number }[];
  /** ファサードを通らずに本物のAPIやネットワークへ到達しうる書き方 */
  bypass: { pattern: string; line: number }[];
  /** 外部URLの文字列リテラル(情報表示のみ。実行時には制御されない) */
  urlLiterals: { url: string; line: number }[];
};

type Significant = { type: Token['type']; value: string; line: number };

const LINE_BREAK = /\r\n|[\n\r\u2028\u2029]/g;

const countLineBreaks = (value: string): number => value.match(LINE_BREAK)?.length ?? 0;

const SKIPPED_TYPES = new Set<Token['type']>([
  'WhiteSpace',
  'LineTerminatorSequence',
  'SingleLineComment',
  'MultiLineComment',
  'HashbangComment',
]);

/** 空白・改行・コメントを除いたトークン列に、行番号を付けて返します */
const toSignificantTokens = (code: string): Significant[] => {
  const result: Significant[] = [];
  let line = 1;
  for (const token of jsTokens(code)) {
    if (!SKIPPED_TYPES.has(token.type)) {
      result.push({ type: token.type, value: token.value, line });
    }
    line += countLineBreaks(token.value);
  }
  return result;
};

const isStringToken = (token: Significant | undefined): boolean =>
  token?.type === 'StringLiteral' || token?.type === 'NoSubstitutionTemplate';

/**
 * 文字列リテラルの中身を返します
 *
 * エスケープを含むものは、見た目と実際の値が一致しない可能性があるため`null`を返します
 * (判定に使う値は、利用者が承認画面で目にするものと同じでなければならない)
 */
export const unquoteLiteral = (raw: string): string | null => {
  const quote = raw[0];
  if (quote !== '"' && quote !== "'" && quote !== '`') {
    return null;
  }
  if (raw.length < 2 || raw[raw.length - 1] !== quote) {
    return null;
  }
  const inner = raw.slice(1, -1);
  return inner.includes('\\') ? null : inner;
};

const isPunctuator = (token: Significant | undefined, value: string): boolean =>
  token?.type === 'Punctuator' && token.value === value;

const isIdentifier = (token: Significant | undefined, value?: string): boolean =>
  token?.type === 'IdentifierName' && (value === undefined || token.value === value);

const isMemberAccess = (token: Significant | undefined): boolean =>
  isPunctuator(token, '.') || isPunctuator(token, '?.');

const OPENERS = new Set(['(', '[', '{', '${']);
const CLOSERS = new Set([')', ']', '}']);

/**
 * `(`の位置から、トップレベルのカンマで区切った引数のトークン列を返します
 *
 * @param openIndex `(`トークンの位置
 */
const readArguments = (tokens: Significant[], openIndex: number): Significant[][] => {
  const args: Significant[][] = [[]];
  let depth = 0;
  for (let index = openIndex + 1; index < tokens.length; index++) {
    const token = tokens[index]!;
    const isTemplateHead = token.type === 'TemplateHead';
    const isTemplateTail = token.type === 'TemplateTail';
    if (depth === 0 && isPunctuator(token, ')')) {
      break;
    }
    if (depth === 0 && isPunctuator(token, ',')) {
      args.push([]);
      continue;
    }
    if ((token.type === 'Punctuator' && OPENERS.has(token.value)) || isTemplateHead) {
      depth++;
    } else if ((token.type === 'Punctuator' && CLOSERS.has(token.value)) || isTemplateTail) {
      depth--;
    }
    args[args.length - 1]!.push(token);
  }
  return args;
};

/** 引数が文字列リテラル1つだけなら、その中身を返します */
const literalArgument = (arg: Significant[] | undefined): string | null => {
  if (arg?.length !== 1 || !isStringToken(arg[0])) {
    return null;
  }
  return unquoteLiteral(arg[0]!.value);
};

const API_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);

const toApiMethod = (arg: Significant[] | undefined): ApiMethod => {
  const literal = literalArgument(arg)?.toUpperCase();
  return literal !== undefined && API_METHODS.has(literal) ? (literal as ApiMethod) : 'unknown';
};

/** 第1引数に含まれるkintoneのAPIパスらしき文字列リテラル(`kintone.api.url('/k/v1/...')`を含む) */
const findApiPath = (arg: Significant[] | undefined): string | null => {
  for (const token of arg ?? []) {
    if (!isStringToken(token)) {
      continue;
    }
    const literal = unquoteLiteral(token.value);
    if (literal !== null && (literal.startsWith('/k/') || /^https?:\/\//i.test(literal))) {
      return literal;
    }
  }
  return null;
};

/** 名前だけで迂回とみなす識別子(`.fetch`のようなメンバーアクセスも含む) */
const ALWAYS_BYPASS_NAMES = new Set([
  'globalThis',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'sendBeacon',
  'eval',
  'importScripts',
  'Worker',
  'SharedWorker',
  'defaultView',
  'contentWindow',
  'contentDocument',
  'srcdoc',
]);

/** 計算プロパティ(`self[...]`)で本物のグローバルへ到達しうる識別子 */
const WINDOW_ALIASES = new Set(['window', 'self', 'top', 'parent', 'frames', 'opener']);

/** 生成するとスクリプトの実行や別ウィンドウへの到達につながる要素 */
const DANGEROUS_ELEMENTS = new Set(['script', 'iframe', 'frame', 'object', 'embed']);

/** 文字列の中にあっても、実行につながる断片 */
const DANGEROUS_STRING_FRAGMENTS = [/<\s*script/i, /<\s*iframe/i];

/**
 * 何も実行しない`javascript:`URL(`javascript:void(0)` / `javascript:;` / `javascript:`)
 *
 * リンクのプレースホルダーとしてよく使われるため、迂回パターンから除く
 */
const HARMLESS_JAVASCRIPT_URL =
  /javascript:\s*(?:void\s*\(\s*0\s*\)|void\s+0)?\s*;?\s*(?=["'`\s>]|$)/gi;

/** 文字列に、コードを実行する`javascript:`URLが含まれるか */
const hasExecutableJavascriptUrl = (value: string): boolean =>
  /javascript:/i.test(value.replace(HARMLESS_JAVASCRIPT_URL, ''));

type BypassRule = (tokens: Significant[], index: number) => string | null;

const bypassRules: BypassRule[] = [
  // Unicodeエスケープを含む識別子(fetch の f を \u0066 と書くなど)は、名前による判定をすり抜ける
  (tokens, index) => {
    const token = tokens[index]!;
    return isIdentifier(token) && token.value.includes('\\') ? 'escaped-identifier' : null;
  },
  (tokens, index) => {
    const token = tokens[index]!;
    return isIdentifier(token) && ALWAYS_BYPASS_NAMES.has(token.value) ? token.value : null;
  },
  // `window.kintone` / `self.kintone` など、`kintone`をメンバーとして参照する
  (tokens, index) =>
    isIdentifier(tokens[index], 'kintone') && isMemberAccess(tokens[index - 1]) ? '.kintone' : null,
  // `window[...]` / `self[...]` など、計算プロパティによるグローバルの参照
  (tokens, index) => {
    const token = tokens[index]!;
    return isIdentifier(token) &&
      WINDOW_ALIASES.has(token.value) &&
      !isMemberAccess(tokens[index - 1]) &&
      isPunctuator(tokens[index + 1], '[')
      ? `${token.value}[...]`
      : null;
  },
  // `const w = window` のように、windowを値として持ち出す
  (tokens, index) => {
    const next = tokens[index + 1];
    return isIdentifier(tokens[index], 'window') &&
      !isMemberAccess(tokens[index - 1]) &&
      !isMemberAccess(next) &&
      !isPunctuator(next, '[')
      ? 'window'
      : null;
  },
  // `Function(...)` / `new Function(...)`
  (tokens, index) =>
    isIdentifier(tokens[index], 'Function') &&
    !isMemberAccess(tokens[index - 1]) &&
    (isPunctuator(tokens[index + 1], '(') || isIdentifier(tokens[index - 1], 'new'))
      ? 'Function'
      : null,
  // `(() => {}).constructor('...')` などによるFunctionコンストラクターの取り出し
  (tokens, index) =>
    isIdentifier(tokens[index], 'constructor') && isMemberAccess(tokens[index - 1])
      ? '.constructor'
      : null,
  // 動的import
  (tokens, index) =>
    isIdentifier(tokens[index], 'import') && isPunctuator(tokens[index + 1], '(')
      ? 'import()'
      : null,
  // 非公開のkintone内部オブジェクト
  (tokens, index) =>
    isIdentifier(tokens[index], 'cybozu') && !isMemberAccess(tokens[index - 1]) ? 'cybozu' : null,
  // 文字列を渡す setTimeout / setInterval
  (tokens, index) => {
    const token = tokens[index]!;
    if (!isIdentifier(token) || (token.value !== 'setTimeout' && token.value !== 'setInterval')) {
      return null;
    }
    const next = tokens[index + 2];
    return isPunctuator(tokens[index + 1], '(') &&
      (isStringToken(next) || next?.type === 'TemplateHead')
      ? `${token.value}(string)`
      : null;
  },
  // createElement('script') / createElement('iframe') など
  (tokens, index) => {
    const token = tokens[index]!;
    if (
      !isIdentifier(token) ||
      (token.value !== 'createElement' && token.value !== 'createElementNS') ||
      !isPunctuator(tokens[index + 1], '(')
    ) {
      return null;
    }
    const args = readArguments(tokens, index + 1);
    const tag = literalArgument(token.value === 'createElement' ? args[0] : args[1]);
    return tag !== null && DANGEROUS_ELEMENTS.has(tag.toLowerCase())
      ? `createElement('${tag.toLowerCase()}')`
      : null;
  },
  // 文字列に含まれる <script> / <iframe> / javascript:
  (tokens, index) => {
    const token = tokens[index]!;
    const isStringLike =
      isStringToken(token) ||
      token.type === 'TemplateHead' ||
      token.type === 'TemplateMiddle' ||
      token.type === 'TemplateTail';
    if (!isStringLike) {
      return null;
    }
    const fragment = DANGEROUS_STRING_FRAGMENTS.find((pattern) => pattern.test(token.value));
    if (fragment) {
      return `string:${fragment.source}`;
    }
    return hasExecutableJavascriptUrl(token.value) ? 'string:javascript:' : null;
  },
];

/** `kintone . api (` の位置なら`(`の位置を返します */
const matchKintoneCall = (tokens: Significant[], index: number, path: string[]): number | null => {
  if (!isIdentifier(tokens[index], 'kintone') || isMemberAccess(tokens[index - 1])) {
    return null;
  }
  let cursor = index + 1;
  for (const name of path) {
    // `kintone?.api` のようなオプショナルチェイニングも同じ呼び出しとして扱う
    if (!isMemberAccess(tokens[cursor]) || !isIdentifier(tokens[cursor + 1], name)) {
      return null;
    }
    cursor += 2;
  }
  // `kintone.api?.(...)` のオプショナル呼び出し
  if (isPunctuator(tokens[cursor], '?.')) {
    cursor += 1;
  }
  return isPunctuator(tokens[cursor], '(') ? cursor : null;
};

const EXTERNAL_URL = /^(https?:)?\/\//i;

/**
 * JSアセットの権限の使用箇所と迂回パターンを検出します
 */
export const detectJsCapabilityUsage = (code: string): JsCapabilityUsage => {
  const tokens = toSignificantTokens(code);
  const usage: JsCapabilityUsage = { apiCalls: [], external: [], bypass: [], urlLiterals: [] };

  tokens.forEach((token, index) => {
    const apiOpen = matchKintoneCall(tokens, index, ['api']);
    if (apiOpen !== null) {
      const [pathArg, methodArg] = readArguments(tokens, apiOpen);
      usage.apiCalls.push({
        method: toApiMethod(methodArg),
        path: findApiPath(pathArg),
        line: token.line,
      });
    }
    const proxyOpen =
      matchKintoneCall(tokens, index, ['proxy']) ??
      matchKintoneCall(tokens, index, ['proxy', 'upload']);
    if (proxyOpen !== null) {
      const [targetArg] = readArguments(tokens, proxyOpen);
      usage.external.push({ target: literalArgument(targetArg), line: token.line });
    }

    for (const rule of bypassRules) {
      const pattern = rule(tokens, index);
      if (pattern !== null) {
        usage.bypass.push({ pattern, line: token.line });
      }
    }

    if (isStringToken(token)) {
      const literal = unquoteLiteral(token.value);
      if (literal !== null && EXTERNAL_URL.test(literal)) {
        usage.urlLiterals.push({ url: literal, line: token.line });
      }
    }
  });

  return usage;
};
