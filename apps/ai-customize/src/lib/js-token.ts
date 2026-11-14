import jsTokens, { type Token } from 'js-tokens';

/**
 * アセットのJSを静的に走査するためのトークン列と、その判定の部品
 *
 * 文字列・コメント・正規表現リテラルを区別するためにトークナイザーを使う。
 * 正規表現を生のコードへ当てると、コメント中の`fetch(`で誤検知し、文字列連結で見逃すため。
 */

/** 空白・改行・コメントを除いたトークン */
export type Significant = { type: Token['type']; value: string; line: number };

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
export const toSignificantTokens = (code: string): Significant[] => {
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

/** 置換を含まない文字列リテラル(`'...'` / `"..."` / `` `...` ``) */
export const isStringToken = (token: Significant | undefined): boolean =>
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

export const isPunctuator = (token: Significant | undefined, value: string): boolean =>
  token?.type === 'Punctuator' && token.value === value;

export const isIdentifier = (token: Significant | undefined, value?: string): boolean =>
  token?.type === 'IdentifierName' && (value === undefined || token.value === value);

export const isMemberAccess = (token: Significant | undefined): boolean =>
  isPunctuator(token, '.') || isPunctuator(token, '?.');

const OPENERS = new Set(['(', '[', '{', '${']);
const CLOSERS = new Set([')', ']', '}']);

/** 括弧の増減を返します(`(` `[` `{` とテンプレートの先頭は+1、閉じ括弧とテンプレートの末尾は-1) */
export const depthDelta = (token: Significant): number => {
  if ((token.type === 'Punctuator' && OPENERS.has(token.value)) || token.type === 'TemplateHead') {
    return 1;
  }
  if ((token.type === 'Punctuator' && CLOSERS.has(token.value)) || token.type === 'TemplateTail') {
    return -1;
  }
  return 0;
};

/**
 * 1つの引数として保持するトークンの上限
 *
 * 判定に使うのは先頭の数トークン(文字列リテラル1つか、`kintone.api.url('/k/v1/…')`など)だけである。
 * 全トークンを持つと、`f(f(f(…)))`のような入れ子の呼び出しで二乗の時間がかかる
 */
const MAX_ARGUMENT_TOKENS = 16;

/**
 * `(`の位置から、トップレベルのカンマで区切った引数のトークン列を返します
 *
 * 各引数は先頭の`MAX_ARGUMENT_TOKENS`個までを持つ(それより長い引数は、文字列リテラル1つではない)。
 *
 * @param openIndex `(`トークンの位置
 */
export const readArguments = (
  tokens: Significant[],
  openIndex: number,
  brackets: BracketIndex
): Significant[][] => {
  const close = brackets.get(openIndex) ?? tokens.length;
  const args: Significant[][] = [[]];
  let index = openIndex + 1;
  while (index < close) {
    const token = tokens[index] as Significant;
    if (isPunctuator(token, ',')) {
      args.push([]);
      index++;
      continue;
    }
    // 括弧の中は対応表で飛ばし、先頭の数トークンだけを持つ
    const groupClose = brackets.get(index);
    const next = groupClose === undefined ? index + 1 : groupClose + 1;
    const current = args[args.length - 1] as Significant[];
    const room = Math.max(0, MAX_ARGUMENT_TOKENS - current.length);
    current.push(...tokens.slice(index, Math.min(next, index + room)));
    index = next;
  }
  return args;
};

/** 開き括弧の位置から、対応する閉じ括弧の位置を引く表 */
export type BracketIndex = ReadonlyMap<number, number>;

/**
 * `(` / `[` / `{` とテンプレートの先頭から、対応する閉じ括弧(テンプレートは末尾)の位置を引く表を、1回の走査で作ります
 *
 * 括弧ごとに閉じ括弧を探し直すと、入れ子の深いコードで二乗の時間がかかる(128KiBで数秒)。
 * 起動時にメインスレッドで走るため、走査は必ず線形に保つ
 */
export const buildBracketIndex = (tokens: Significant[]): BracketIndex => {
  const matches = new Map<number, number>();
  const openers: number[] = [];
  tokens.forEach((token, index) => {
    const delta = depthDelta(token);
    if (delta > 0) {
      openers.push(index);
    } else if (delta < 0) {
      const open = openers.pop();
      if (open !== undefined) matches.set(open, index);
    }
  });
  return matches;
};

/** 引数が文字列リテラル1つだけなら、その中身を返します */
export const literalArgument = (arg: Significant[] | undefined): string | null => {
  const [first] = arg ?? [];
  if (arg?.length !== 1 || !isStringToken(first)) {
    return null;
  }
  return unquoteLiteral((first as Significant).value);
};
