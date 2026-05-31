/**
 * CSP安全な再帰降下パーサーによる算術式評価器。
 * eval / Function は使用しない。
 *
 * サポート: +, -, *, /, (), 単項マイナス
 *
 * 文法:
 *   expression = term (('+' | '-') term)*
 *   term       = unary (('*' | '/') unary)*
 *   unary      = '-' unary | primary
 *   primary    = NUMBER | '(' expression ')'
 */

type Token = { type: 'number'; value: number } | { type: 'op'; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input.charAt(i);
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if ('+-*/()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if (/[\d.]/.test(ch)) {
      let num = '';
      while (i < input.length && /[\d.]/.test(input.charAt(i))) {
        num += input.charAt(i);
        i++;
      }
      const parsed = Number(num);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number: ${num}`);
      }
      tokens.push({ type: 'number', value: parsed });
      continue;
    }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): number {
    const result = this.expression();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected token after expression');
    }
    return result;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token | undefined {
    return this.tokens[this.pos++];
  }

  private expression(): number {
    let left = this.term();
    let tok = this.peek();
    while (tok?.type === 'op' && (tok.value === '+' || tok.value === '-')) {
      const op = this.consume()!.value;
      const right = this.term();
      left = op === '+' ? left + right : left - right;
      tok = this.peek();
    }
    return left;
  }

  private term(): number {
    let left = this.unary();
    let tok = this.peek();
    while (tok?.type === 'op' && (tok.value === '*' || tok.value === '/')) {
      const op = this.consume()!.value;
      const right = this.unary();
      left = op === '*' ? left * right : left / right;
      tok = this.peek();
    }
    return left;
  }

  private unary(): number {
    const tok = this.peek();
    if (tok?.type === 'op' && tok.value === '-') {
      this.consume();
      return -this.unary();
    }
    return this.primary();
  }

  private primary(): number {
    const token = this.peek();
    if (!token) {
      throw new Error('Unexpected end of expression');
    }
    if (token.type === 'number') {
      this.consume();
      return token.value;
    }
    if (token.type === 'op' && token.value === '(') {
      this.consume();
      const result = this.expression();
      const closing = this.consume();
      if (!closing || closing.value !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      return result;
    }
    throw new Error(`Unexpected token: ${token.value}`);
  }
}

/**
 * 数式文字列を安全に評価する。
 * 無効な式の場合は NaN を返す。
 */
export function safeEvaluate(expression: string): number {
  try {
    if (!expression.trim()) {
      return NaN;
    }
    const tokens = tokenize(expression);
    if (tokens.length === 0) {
      return NaN;
    }
    return new Parser(tokens).parse();
  } catch {
    return NaN;
  }
}

/**
 * EmbeddableInput 形式の計算式が構文的に正しいか検証する。
 * {{fieldCode:XXX}} を数値 1 に置換して safeEvaluate で評価する。
 * 空文字の場合は valid とみなす。
 */
export function isValidCalcExpression(expression: string): boolean {
  if (!expression.trim()) return true;
  const resolved = expression.replace(/\{\{fieldCode:[^}]+\}\}/g, '1');
  const result = safeEvaluate(resolved);
  return !isNaN(result);
}
