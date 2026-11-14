import { resolveExternalReference } from './external-target';

/**
 * CSSアセットから外部通信になる参照を抜き出します
 *
 * `url(...)` / `@import "..."` / `image-set("...")` を対象にする。`@font-face`の`src`は`url()`で書かれる。
 * 相対URL・`data:`・kintoneと同一オリジンは外部通信に数えない。
 *
 * 文字列の外にCSSのエスケープ(`u\72l(`など)がある場合は、見た目と解釈がずれうるため、
 * 送信先を判定できない参照(`target: null`)として扱う。
 *
 * @see docs/13-launch-gate-and-permissions.md 3-3-2章
 */

export type CssExternalReference = { target: string | null; line: number };

type RawReference = { value: string | null; line: number };

const isIdentifierChar = (char: string | undefined): boolean =>
  char !== undefined && /[\w-]/.test(char);

/** 大文字小文字を区別せず、`position`から`keyword`が始まるか */
const startsWithKeyword = (css: string, position: number, keyword: string): boolean =>
  css.slice(position, position + keyword.length).toLowerCase() === keyword;

type ScanState = {
  references: RawReference[];
  line: number;
  hasEscapeOutsideString: boolean;
  /** `image-set(`の中にいる間のカッコの深さ。外なら0 */
  imageSetDepth: number;
  /** `@namespace`の宣言の中(`;`まで)にいるか */
  inNamespace: boolean;
};

/** 文字列リテラルを読み、終端の次の位置と中身を返します。エスケープを含む中身は`null` */
const readString = (
  css: string,
  start: number
): { end: number; value: string | null; lineBreaks: number } => {
  const quote = css[start];
  let index = start + 1;
  let hasEscape = false;
  let lineBreaks = 0;
  while (index < css.length && css[index] !== quote) {
    if (css[index] === '\\') {
      hasEscape = true;
      index++;
    }
    if (css[index] === '\n') {
      lineBreaks++;
    }
    index++;
  }
  const inner = css.slice(start + 1, index);
  return { end: index + 1, value: hasEscape ? null : inner, lineBreaks };
};

/** `url(`の中身を読みます(`position`は`url(`の直後) */
const readUrlFunction = (
  css: string,
  position: number
): { end: number; value: string | null; lineBreaks: number } => {
  let index = position;
  while (/\s/.test(css[index] ?? '')) {
    index++;
  }
  if (css[index] === '"' || css[index] === "'") {
    const string = readString(css, index);
    const close = css.indexOf(')', string.end);
    return {
      end: close === -1 ? css.length : close + 1,
      value: string.value,
      lineBreaks: string.lineBreaks,
    };
  }
  const close = css.indexOf(')', index);
  const raw = css.slice(index, close === -1 ? css.length : close).trim();
  return {
    end: close === -1 ? css.length : close + 1,
    value: raw.includes('\\') ? null : raw,
    lineBreaks: 0,
  };
};

const scan = (css: string): ScanState => {
  const state: ScanState = {
    references: [],
    line: 1,
    hasEscapeOutsideString: false,
    imageSetDepth: 0,
    inNamespace: false,
  };
  let index = 0;
  while (index < css.length) {
    const char = css[index] as string;

    if (char === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      const comment = css.slice(index, end === -1 ? css.length : end + 2);
      state.line += comment.split('\n').length - 1;
      index += comment.length;
      continue;
    }
    if (char === '\n') {
      state.line++;
      index++;
      continue;
    }
    if (char === '\\') {
      state.hasEscapeOutsideString = true;
      index += 2;
      continue;
    }
    if (char === '"' || char === "'") {
      const string = readString(css, index);
      if (state.imageSetDepth > 0 && !state.inNamespace) {
        state.references.push({ value: string.value, line: state.line });
      }
      state.line += string.lineBreaks;
      index = string.end;
      continue;
    }
    if (char === ';') {
      state.inNamespace = false;
    }
    if (char === '@') {
      if (startsWithKeyword(css, index, '@namespace')) {
        state.inNamespace = true;
      } else if (startsWithKeyword(css, index, '@import')) {
        let cursor = index + '@import'.length;
        while (/\s/.test(css[cursor] ?? '')) {
          cursor++;
        }
        if (css[cursor] === '"' || css[cursor] === "'") {
          const string = readString(css, cursor);
          state.references.push({ value: string.value, line: state.line });
          state.line += string.lineBreaks;
          index = string.end;
          continue;
        }
      }
    }
    if (!isIdentifierChar(css[index - 1]) && startsWithKeyword(css, index, 'url(')) {
      const url = readUrlFunction(css, index + 'url('.length);
      if (!state.inNamespace) {
        state.references.push({ value: url.value, line: state.line });
      }
      state.line += url.lineBreaks;
      index = url.end;
      continue;
    }
    if (!isIdentifierChar(css[index - 1]) && startsWithKeyword(css, index, 'image-set(')) {
      state.imageSetDepth = 1;
      index += 'image-set('.length;
      continue;
    }
    if (!isIdentifierChar(css[index - 1]) && startsWithKeyword(css, index, '-webkit-image-set(')) {
      state.imageSetDepth = 1;
      index += '-webkit-image-set('.length;
      continue;
    }
    if (state.imageSetDepth > 0 && char === '(') {
      state.imageSetDepth++;
    } else if (state.imageSetDepth > 0 && char === ')') {
      state.imageSetDepth--;
    }
    index++;
  }
  return state;
};

/**
 * CSSアセットの外部参照を返します
 *
 * @param origin kintoneのオリジン(`location.origin`)
 */
export const detectCssExternalReferences = (
  css: string,
  origin: string
): CssExternalReference[] => {
  const state = scan(css);
  const references = state.references.flatMap(({ value, line }) => {
    const target = resolveExternalReference(value, origin);
    return target === undefined ? [] : [{ target, line }];
  });
  return state.hasEscapeOutsideString ? [...references, { target: null, line: 1 }] : references;
};
