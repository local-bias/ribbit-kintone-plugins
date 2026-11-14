import { detectGlobalAliasValues } from './global-alias-detector';
import { scanHtmlTags } from './html-tag-scanner';
import { detectResourceLoads, type ResourceLoad } from './js-resource-detector';
import { collectStringUnits, type StringUnit } from './js-string-unit';
import {
  type BracketIndex,
  buildBracketIndex,
  isIdentifier,
  isMemberAccess,
  isPunctuator,
  isStringToken,
  literalArgument,
  readArguments,
  type Significant,
  toSignificantTokens,
  unquoteLiteral,
} from './js-token';

/**
 * アセットのコードを静的に走査し、権限の使用箇所と迂回パターンを検出します
 *
 * 文字列・コメント・正規表現リテラルを区別するためにトークナイザーを使う(`js-token.ts`)。
 * 文字列は連結・テンプレートをつないだ単位で検査する(`js-string-unit.ts`)。
 * 起動時にメインスレッドで走るため、全ての走査を線形に保つ。
 *
 * 検出は「うっかり」を止めるためのもので、悪意ある難読化は止められない(docs/13 3-1章)。
 */

export { unquoteLiteral };

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'unknown';

export type JsCapabilityUsage = {
  /** `kintone.api(...)`の呼び出し。メソッドがリテラルでなければ`unknown` */
  apiCalls: { method: ApiMethod; path: string | null; line: number }[];
  /** `kintone.proxy(...)` / `kintone.proxy.upload(...)`。送信先がリテラルでなければ`target: null` */
  external: { target: string | null; line: number }[];
  /**
   * `kintone.proxy`を通らない外部リソースの読み込み(`img.src = 'https://…'`など)
   *
   * CSSの`url()`と同じ基準で、外部通信の設定と照合する。組み立てられた送信先は`target: null`
   */
  resources: ResourceLoad[];
  /** ファサードを通らずに本物のAPIやネットワークへ到達しうる書き方 */
  bypass: { pattern: string; line: number }[];
  /** 外部URLの文字列リテラル(情報表示のみ。実行時には制御されない) */
  urlLiterals: { url: string; line: number }[];
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

/** 生成するとスクリプトの実行や別ウィンドウへの到達につながる要素 */
const DANGEROUS_ELEMENTS = new Set(['script', 'iframe', 'frame', 'object', 'embed']);

/** 文字列の中にあっても、実行につながる断片 */
const DANGEROUS_STRING_FRAGMENTS = [/<\s*script/i, /<\s*iframe/i];

/** インラインのイベントハンドラ属性(`<img onerror=...>`)の名前 */
const INLINE_EVENT_HANDLER = /^on[a-z]+$/;

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

type BypassRule = (tokens: Significant[], index: number, brackets: BracketIndex) => string | null;

const bypassRules: BypassRule[] = [
  // Unicodeエスケープを含む識別子(fetch の f を f と書くなど)は、名前による判定をすり抜ける
  (tokens, index) => {
    const token = tokens[index];
    return isIdentifier(token) && token?.value.includes('\\') ? 'escaped-identifier' : null;
  },
  (tokens, index) => {
    const token = tokens[index];
    return isIdentifier(token) && ALWAYS_BYPASS_NAMES.has(token?.value ?? '')
      ? (token?.value ?? null)
      : null;
  },
  // `window.kintone` / `self.kintone` など、`kintone`をメンバーとして参照する
  (tokens, index) =>
    isIdentifier(tokens[index], 'kintone') && isMemberAccess(tokens[index - 1]) ? '.kintone' : null,
  // `window[...]`。計算プロパティによるグローバルの参照
  // (`self[...]`などの別名は、同名の変数と区別するため global-alias-detector で数える)
  (tokens, index) =>
    isIdentifier(tokens[index], 'window') &&
    !isMemberAccess(tokens[index - 1]) &&
    isPunctuator(tokens[index + 1], '[')
      ? 'window[...]'
      : null,
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
  // `document.write(...)` / `document.writeln(...)`。文字列からスクリプトを差し込める
  (tokens, index) =>
    (isIdentifier(tokens[index], 'write') || isIdentifier(tokens[index], 'writeln')) &&
    isMemberAccess(tokens[index - 1]) &&
    isIdentifier(tokens[index - 2], 'document')
      ? 'document.write'
      : null,
  // 文字列を渡す setTimeout / setInterval
  (tokens, index) => {
    const token = tokens[index];
    if (!isIdentifier(token) || (token?.value !== 'setTimeout' && token?.value !== 'setInterval')) {
      return null;
    }
    const next = tokens[index + 2];
    return isPunctuator(tokens[index + 1], '(') &&
      (isStringToken(next) || next?.type === 'TemplateHead')
      ? `${token.value}(string)`
      : null;
  },
  // createElement('script') / createElement('iframe') など
  (tokens, index, brackets) => {
    const token = tokens[index];
    if (
      !isIdentifier(token) ||
      (token?.value !== 'createElement' && token?.value !== 'createElementNS') ||
      !isPunctuator(tokens[index + 1], '(')
    ) {
      return null;
    }
    const args = readArguments(tokens, index + 1, brackets);
    const tag = literalArgument(token.value === 'createElement' ? args[0] : args[1]);
    return tag !== null && DANGEROUS_ELEMENTS.has(tag.toLowerCase())
      ? `createElement('${tag.toLowerCase()}')`
      : null;
  },
];

/**
 * 文字列に含まれる <script> / <iframe> / インラインのイベントハンドラ / コードを実行する javascript: URL
 *
 * 連結・テンプレートをつないだ単位で判定する(`'<img onerror="' + code + '">'`を見落とさないため)
 */
const detectDangerousString = (unit: StringUnit): string | null => {
  const fragment = DANGEROUS_STRING_FRAGMENTS.find((pattern) => pattern.test(unit.content));
  if (fragment) {
    return `string:${fragment.source}`;
  }
  const hasInlineHandler = scanHtmlTags(unit.content).some((tag) =>
    tag.attributes.some(({ name, value }) => value !== null && INLINE_EVENT_HANDLER.test(name))
  );
  if (hasInlineHandler) {
    return 'string:on*=';
  }
  return hasExecutableJavascriptUrl(unit.content) ? 'string:javascript:' : null;
};

const byLine = <T extends { line: number }>(a: T, b: T): number => a.line - b.line;

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
  const brackets = buildBracketIndex(tokens);
  const units = collectStringUnits(tokens, brackets);
  const usage: JsCapabilityUsage = {
    apiCalls: [],
    external: [],
    resources: detectResourceLoads(tokens, units, brackets).sort(byLine),
    bypass: [],
    urlLiterals: [],
  };

  tokens.forEach((token, index) => {
    const apiOpen = matchKintoneCall(tokens, index, ['api']);
    if (apiOpen !== null) {
      const [pathArg, methodArg] = readArguments(tokens, apiOpen, brackets);
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
      const [targetArg] = readArguments(tokens, proxyOpen, brackets);
      usage.external.push({ target: literalArgument(targetArg), line: token.line });
    }

    for (const rule of bypassRules) {
      const pattern = rule(tokens, index, brackets);
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

  const dangerousStrings = units.flatMap((unit) => {
    const pattern = detectDangerousString(unit);
    return pattern === null ? [] : [{ pattern, line: unit.line }];
  });
  return {
    ...usage,
    bypass: [
      ...usage.bypass,
      ...detectGlobalAliasValues(tokens, brackets),
      ...dangerousStrings,
    ].sort(byLine),
  };
};
