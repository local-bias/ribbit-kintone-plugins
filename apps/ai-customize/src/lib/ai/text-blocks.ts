/**
 * AIの返答を、文章とコードブロック(```)に分けます(純粋関数)
 *
 * Markdownを解釈してHTMLにはしない(返答に含まれる文字列を、画面ではテキストとしてだけ描く)。
 * 行ごとに読み、```で始まる行でコードブロックを開閉する。閉じていなければ末尾までをコードにする
 */

export type TextBlock =
  | { type: 'text'; text: string }
  | { type: 'code'; language: string; code: string };

const FENCE = /^\s*```\s*([\w+-]*)/;

export const splitTextBlocks = (text: string): TextBlock[] => {
  const blocks: TextBlock[] = [];
  let buffer: string[] = [];
  let code: { language: string; lines: string[] } | null = null;

  const flushText = () => {
    const value = buffer.join('\n').trim();
    if (value !== '') blocks.push({ type: 'text', text: value });
    buffer = [];
  };

  for (const line of text.split(/\r\n|\r|\n/)) {
    const fence = FENCE.exec(line);
    if (code === null && fence !== null) {
      flushText();
      code = { language: fence[1] ?? '', lines: [] };
    } else if (code !== null && fence !== null && line.trim() === '```') {
      blocks.push({ type: 'code', language: code.language, code: code.lines.join('\n') });
      code = null;
    } else if (code !== null) {
      code.lines.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (code !== null) {
    blocks.push({ type: 'code', language: code.language, code: code.lines.join('\n') });
  }
  flushText();
  return blocks;
};
