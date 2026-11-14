/**
 * コード中の文字列に書かれたHTMLから、タグと属性を読み取ります
 *
 * 正規表現の`<tag [^>]*>`は、`title="a>b"`のように属性値の中の`>`でタグを打ち切り、後ろの属性を見落とす。
 * 引用符を意識して1文字ずつ読む。
 */

export type HtmlAttribute = {
  /** 小文字の属性名 */
  name: string;
  /** 値。`=`の無い属性は`null` */
  value: string | null;
};

export type HtmlTag = { name: string; attributes: HtmlAttribute[] };

const isWhitespace = (char: string | undefined): boolean => char !== undefined && /\s/.test(char);

const isNameStart = (char: string | undefined): boolean =>
  char !== undefined && /[a-z]/i.test(char);

const skipWhitespace = (content: string, start: number): number => {
  let index = start;
  while (isWhitespace(content[index])) index++;
  return index;
};

/** 属性値を読み、値と次の位置を返します */
const readValue = (content: string, start: number): { value: string; next: number } => {
  const quote = content[start];
  if (quote === '"' || quote === "'") {
    const close = content.indexOf(quote, start + 1);
    return close === -1
      ? { value: content.slice(start + 1), next: content.length }
      : { value: content.slice(start + 1, close), next: close + 1 };
  }
  let index = start;
  while (index < content.length && !isWhitespace(content[index]) && content[index] !== '>') {
    index++;
  }
  return { value: content.slice(start, index), next: index };
};

/** タグ名の直後から`>`まで(または文字列の終わりまで)の属性を読みます */
const readAttributes = (
  content: string,
  start: number
): { attributes: HtmlAttribute[]; next: number } => {
  const attributes: HtmlAttribute[] = [];
  let index = start;
  while (index < content.length) {
    index = skipWhitespace(content, index);
    const char = content[index];
    if (char === undefined || char === '>') {
      return { attributes, next: index + 1 };
    }
    const nameStart = index;
    while (index < content.length && !/[\s=>/]/.test(content[index] ?? '')) index++;
    if (index === nameStart) {
      // `/`や、名前として読めない文字は1文字ずつ飛ばす
      index++;
      continue;
    }
    const name = content.slice(nameStart, index).toLowerCase();
    const afterName = skipWhitespace(content, index);
    if (content[afterName] !== '=') {
      attributes.push({ name, value: null });
      continue;
    }
    const { value, next } = readValue(content, skipWhitespace(content, afterName + 1));
    attributes.push({ name, value });
    index = next;
  }
  return { attributes, next: index };
};

/** 文字列に含まれるHTMLのタグを、属性つきで返します */
export const scanHtmlTags = (content: string): HtmlTag[] => {
  const tags: HtmlTag[] = [];
  let index = content.indexOf('<');
  while (index !== -1 && index < content.length) {
    if (!isNameStart(content[index + 1])) {
      index = content.indexOf('<', index + 1);
      continue;
    }
    let nameEnd = index + 1;
    while (nameEnd < content.length && /[\w-]/.test(content[nameEnd] ?? '')) nameEnd++;
    const { attributes, next } = readAttributes(content, nameEnd);
    tags.push({ name: content.slice(index + 1, nameEnd).toLowerCase(), attributes });
    index = content.indexOf('<', next);
  }
  return tags;
};
