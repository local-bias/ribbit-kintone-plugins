import { scanHtmlTags } from './html-tag-scanner';
import { STRING_PLACEHOLDER, type StringUnit } from './js-string-unit';
import {
  type BracketIndex,
  isIdentifier,
  isMemberAccess,
  isPunctuator,
  isStringToken,
  literalArgument,
  readArguments,
  type Significant,
  unquoteLiteral,
} from './js-token';

/**
 * JSアセットの、外部リソースの読み込みを静的に検出します
 *
 * `img.src = 'https://…'`、`innerHTML`へ入れる`<img src="https://…">`、文字列の`url(https://…)`は、
 * `kintone.proxy`を通らずに外部と通信する。CSSアセットの`url()`と同じ基準で外部通信の設定と照合できるよう、
 * 送信先を取り出す(照合は`checkCapabilityPolicy`)。
 *
 * - 送信先が文字列リテラル1つで書かれていれば、その値
 * - 外部URLで始まるが、連結・テンプレート・複合代入で組み立てられていれば`null`(送信先を判定できない外部通信)
 * - 変数だけで渡された送信先は検出できない(静的検出の限界。docs/13 3-1章)
 * - 画面遷移(`location`・`open()`・`<a href>`)は、利用者に見える操作で正規の用途も多いため数えない
 *
 * @see docs/13-launch-gate-and-permissions.md 3-4章
 */

export type ResourceLoad = { target: string | null; line: number };

/** 代入すると読み込みが始まるプロパティ */
const RESOURCE_PROPERTIES = new Set(['src', 'srcset', 'poster', 'action', 'formAction']);

/** `setAttribute`やHTML文字列で、読み込み先になる属性(小文字) */
const RESOURCE_ATTRIBUTES = new Set([
  'src',
  'srcset',
  'poster',
  'action',
  'formaction',
  'background',
  'data',
]);

const EXTERNAL_START = /^(?:https?:)?\/\//i;

/** エスケープを含んで中身を確定できない文字列が、外部URLらしく始まるか(`https:\/\/`など) */
const LOOKS_EXTERNAL = /^(?:https?:|\/\/|\\)/i;

/** `srcset`の値から、候補のURLを取り出します */
const splitSrcset = (value: string): string[] =>
  value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0] ?? '')
    .filter((url) => url !== '');

/**
 * 属性値(またはプロパティへ代入する値)から、外部の送信先を返します
 *
 * @param isComposed 値が組み立てられているか。外部URLで始まっていれば、送信先は判定できない(`null`)
 */
const externalTargets = (name: string, value: string, isComposed: boolean): (string | null)[] =>
  (name.toLowerCase() === 'srcset' ? splitSrcset(value) : [value.trim()])
    .filter((url) => EXTERNAL_START.test(url))
    .map((url) => (isComposed || url.includes(STRING_PLACEHOLDER) ? null : url));

/** 送信先として書かれた値の先頭トークンから、外部の送信先を読み取ります */
const readValueTargets = (
  name: string,
  first: Significant | undefined,
  isComposed: boolean
): (string | null)[] => {
  if (first?.type === 'TemplateHead') {
    return EXTERNAL_START.test(first.value.slice(1)) ? [null] : [];
  }
  if (first === undefined || !isStringToken(first)) {
    return [];
  }
  const literal = unquoteLiteral(first.value);
  if (literal === null) {
    return LOOKS_EXTERNAL.test(first.value.slice(1, -1)) ? [null] : [];
  }
  return externalTargets(name, literal, isComposed);
};

const isAssignment = (token: Significant | undefined): boolean =>
  isPunctuator(token, '=') || isPunctuator(token, '+=');

/**
 * `img.src = '...'` / `img['src'] = '...'` / `img.src += '...'` の形の代入
 *
 * @param index プロパティ名(識別子、または計算プロパティの文字列)の位置
 */
const detectAssignment = (tokens: Significant[], index: number): (string | null)[] => {
  const token = tokens[index];
  const isDotted = isIdentifier(token) && isMemberAccess(tokens[index - 1]);
  const isComputed =
    isStringToken(token) &&
    isPunctuator(tokens[index - 1], '[') &&
    isPunctuator(tokens[index + 1], ']');
  const property = isDotted ? token?.value : isComputed ? unquoteLiteral(token?.value ?? '') : null;
  if (property === null || property === undefined || !RESOURCE_PROPERTIES.has(property)) {
    return [];
  }
  const operatorIndex = index + (isComputed ? 2 : 1);
  const operator = tokens[operatorIndex];
  if (!isAssignment(operator)) {
    return [];
  }
  const isComposed = isPunctuator(operator, '+=') || isPunctuator(tokens[operatorIndex + 2], '+');
  return readValueTargets(property, tokens[operatorIndex + 1], isComposed);
};

/** `el.setAttribute('src', '...')`の形の呼び出し */
const detectSetAttribute = (
  tokens: Significant[],
  index: number,
  brackets: BracketIndex
): (string | null)[] => {
  if (!isIdentifier(tokens[index], 'setAttribute') || !isPunctuator(tokens[index + 1], '(')) {
    return [];
  }
  const [nameArg, valueArg] = readArguments(tokens, index + 1, brackets);
  const name = literalArgument(nameArg)?.toLowerCase();
  if (name === undefined || !RESOURCE_ATTRIBUTES.has(name)) {
    return [];
  }
  return readValueTargets(name, valueArg?.[0], (valueArg?.length ?? 0) > 1);
};

const CSS_URL = /url\(\s*["']?([^"')\s]*)/gi;

/** HTML文字列の読み込み先の属性と、`url(...)`の値を集めます */
const findValuesInString = (content: string): { name: string; value: string }[] => [
  ...scanHtmlTags(content).flatMap((tag) =>
    tag.attributes.flatMap(({ name, value }) => {
      const isResource = RESOURCE_ATTRIBUTES.has(name) || (name === 'href' && tag.name === 'link');
      return isResource && value !== null ? [{ name, value }] : [];
    })
  ),
  ...[...content.matchAll(CSS_URL)].map((match) => ({ name: 'url', value: match[1] ?? '' })),
];

/**
 * 文字列(連結・テンプレートをつないだ単位)に書かれたHTML・`url(...)`の読み込み先
 *
 * エスケープを含む文字列は見た目と実際の値が一致しないため、外部の送信先を`null`にする
 */
const detectInStrings = (units: readonly StringUnit[]): ResourceLoad[] =>
  units.flatMap((unit) =>
    findValuesInString(unit.content)
      .flatMap(({ name, value }) => externalTargets(name, value, unit.hasEscape))
      .map((target) => ({ target, line: unit.line }))
  );

/** JSアセットの外部リソースの読み込みを返します */
export const detectResourceLoads = (
  tokens: Significant[],
  units: readonly StringUnit[],
  brackets: BracketIndex
): ResourceLoad[] => [
  ...tokens.flatMap((token, index) =>
    [...detectAssignment(tokens, index), ...detectSetAttribute(tokens, index, brackets)].map(
      (target) => ({
        target,
        line: token.line,
      })
    )
  ),
  ...detectInStrings(units),
];
