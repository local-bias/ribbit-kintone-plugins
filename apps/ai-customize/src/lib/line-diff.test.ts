import { describe, expect, test } from 'vitest';
import { countChanges, diffLines, MAX_DIFF_CELLS } from './line-diff';

const compact = (before: string, after: string) =>
  diffLines(before, after).map((line) =>
    line.type === 'same'
      ? `  ${line.text}`
      : line.type === 'added'
        ? `+ ${line.text}`
        : `- ${line.text}`
  );

describe('diffLines', () => {
  test('同じなら全て same', () => {
    expect(compact('a\nb', 'a\nb')).toEqual(['  a', '  b']);
  });

  test('変えた行だけを削除と追加で示す', () => {
    expect(compact('a\nb\nc\nd', 'a\nB\nc\nd\ne')).toEqual([
      '  a',
      '- b',
      '+ B',
      '  c',
      '  d',
      '+ e',
    ]);
  });

  test('行番号は変更前と変更後それぞれで数える', () => {
    expect(diffLines('a\nb\nc', 'x\na\nc')).toEqual([
      { type: 'added', text: 'x', after: 1 },
      { type: 'same', text: 'a', before: 1, after: 2 },
      { type: 'removed', text: 'b', before: 2 },
      { type: 'same', text: 'c', before: 3, after: 3 },
    ]);
  });

  test('新規(空からの差分)は全て追加', () => {
    expect(countChanges(diffLines('', 'a\nb'))).toEqual({ added: 2, removed: 1 });
  });

  test('改行コードの違いは同じ行として扱う', () => {
    expect(compact('a\r\nb', 'a\nb')).toEqual(['  a', '  b']);
  });

  test('比べる行が多すぎれば、残りを全て削除して全て追加として返す', () => {
    const size = Math.ceil(Math.sqrt(MAX_DIFF_CELLS)) + 1;
    const before = Array.from({ length: size }, (_, i) => `a${i}`).join('\n');
    const after = Array.from({ length: size }, (_, i) => `b${i}`).join('\n');
    expect(countChanges(diffLines(`x\n${before}\ny`, `x\n${after}\ny`))).toEqual({
      added: size,
      removed: size,
    });
  });
});
