import {
  type BracketIndex,
  isIdentifier,
  isPunctuator,
  isStringToken,
  type Significant,
} from './js-token';

/**
 * 文字列リテラル・テンプレートリテラルと、それらを`+`でつないだ式を、1つの文字列として組み立てます
 *
 * トークンごとに検査すると、`` `<img src="${a}" onerror="${b}">` `` や `'<img onerror="' + b + '">'` のように
 * 式の差し込みで分かれた属性を見落とす。式の部分は`STRING_PLACEHOLDER`に置き換えて、つないだ全体で検査する。
 */

/** 文字列の中で、式(変数・関数呼び出しなど)が差し込まれる位置 */
export const STRING_PLACEHOLDER = String.fromCharCode(0);

export type StringUnit = {
  /** 文字列部分の中身(エスケープはそのまま)。式の部分は`STRING_PLACEHOLDER` */
  content: string;
  /** 最初のトークンの行番号 */
  line: number;
  /** エスケープを含む(見た目と実際の値が一致しない可能性がある) */
  hasEscape: boolean;
};

/** 文字列・テンプレートの断片から、囲みの記号を除いた中身を返します */
const contentOf = (token: Significant): string => {
  switch (token.type) {
    case 'TemplateHead':
    case 'TemplateMiddle':
      return token.value.slice(1, -2);
    default:
      return token.value.slice(1, -1);
  }
};

type Literal = { text: string; parts: number[]; next: number };

/** テンプレートリテラル(先頭から末尾まで)を、式を`STRING_PLACEHOLDER`に置き換えて読みます */
const readTemplate = (tokens: Significant[], head: number, brackets: BracketIndex): Literal => {
  const end = brackets.get(head) ?? tokens.length - 1;
  const pieces = [contentOf(tokens[head] as Significant)];
  const parts = [head];
  let index = head + 1;
  while (index <= end && index < tokens.length) {
    const token = tokens[index] as Significant;
    const close = brackets.get(index);
    if (close !== undefined) {
      // 式の中の括弧や、入れ子のテンプレートは読み飛ばす
      index = close + 1;
      continue;
    }
    if (token.type === 'TemplateMiddle' || (token.type === 'TemplateTail' && index === end)) {
      pieces.push(contentOf(token));
      parts.push(index);
    }
    index++;
  }
  return { text: pieces.join(STRING_PLACEHOLDER), parts, next: end + 1 };
};

/** `index`の位置が文字列・テンプレートの始まりなら読みます */
const readLiteral = (
  tokens: Significant[],
  index: number,
  brackets: BracketIndex
): Literal | null => {
  const token = tokens[index];
  if (token !== undefined && isStringToken(token)) {
    return { text: contentOf(token), parts: [index], next: index + 1 };
  }
  if (token?.type === 'TemplateHead') {
    return readTemplate(tokens, index, brackets);
  }
  return null;
};

/** `+`より優先順位が高く、1つのオペランドの中に現れうる記号 */
const OPERAND_PUNCTUATORS = new Set(['.', '?.', '*', '/', '%', '**', '!']);

const isOperandToken = (token: Significant): boolean =>
  isIdentifier(token) ||
  token.type === 'NumericLiteral' ||
  token.type === 'PrivateIdentifier' ||
  (token.type === 'Punctuator' && OPERAND_PUNCTUATORS.has(token.value));

/**
 * `+`の後ろの、文字列ではないオペランド(`a.b[0]`、`f(x)`など)を読み飛ばし、次に見る位置を返します
 *
 * 括弧は対応表で飛ばすので、入れ子が深くても線形に終わる
 */
const skipOperand = (tokens: Significant[], start: number, brackets: BracketIndex): number => {
  let index = start;
  while (index < tokens.length) {
    const close = brackets.get(index);
    if (close !== undefined) {
      index = close + 1;
      continue;
    }
    if (!isOperandToken(tokens[index] as Significant)) {
      return index;
    }
    index++;
  }
  return index;
};

/** 先頭の文字列から始まる`+`の連結を読みます */
const readConcatenation = (
  tokens: Significant[],
  first: Literal,
  brackets: BracketIndex
): { content: string; parts: number[] } => {
  const pieces = [first.text];
  const parts = [...first.parts];
  let cursor = first.next;
  while (isPunctuator(tokens[cursor], '+')) {
    const literal = readLiteral(tokens, cursor + 1, brackets);
    if (literal !== null) {
      pieces.push(literal.text);
      parts.push(...literal.parts);
      cursor = literal.next;
      continue;
    }
    const next = skipOperand(tokens, cursor + 1, brackets);
    if (next === cursor + 1) {
      break;
    }
    pieces.push(STRING_PLACEHOLDER);
    cursor = next;
  }
  return { content: pieces.join(''), parts };
};

/**
 * コード中の文字列を、連結・テンプレートをつないだ単位で返します
 *
 * 連結の途中の式に含まれる文字列(`f('x')`の`'x'`)は、それ自体も別の単位として返す
 */
export const collectStringUnits = (tokens: Significant[], brackets: BracketIndex): StringUnit[] => {
  const consumed = new Set<number>();
  const units: StringUnit[] = [];
  tokens.forEach((token, index) => {
    if (consumed.has(index)) {
      return;
    }
    const first = readLiteral(tokens, index, brackets);
    if (first === null) {
      return;
    }
    const { content, parts } = readConcatenation(tokens, first, brackets);
    for (const part of parts) consumed.add(part);
    units.push({ content, line: token.line, hasEscape: content.includes('\\') });
  });
  return units;
};
