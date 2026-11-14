import { describe, expect, test } from 'vitest';
import { splitTextBlocks } from './text-blocks';

describe('splitTextBlocks', () => {
  test('文章とコードブロックを順に分ける', () => {
    const text = '次のCSSです。\n```css\n.a { color: red; }\n```\n保存してください。';
    expect(splitTextBlocks(text)).toEqual([
      { type: 'text', text: '次のCSSです。' },
      { type: 'code', language: 'css', code: '.a { color: red; }' },
      { type: 'text', text: '保存してください。' },
    ]);
  });

  test('閉じていないコードブロックは末尾までをコードにする', () => {
    expect(splitTextBlocks('```js\nconst a = 1;')).toEqual([
      { type: 'code', language: 'js', code: 'const a = 1;' },
    ]);
  });

  test('コードブロックが無ければ文章だけ', () => {
    expect(splitTextBlocks('こんにちは')).toEqual([{ type: 'text', text: 'こんにちは' }]);
  });
});

describe('splitTextBlocks の境界', () => {
  test('空のコードブロックが、後ろの文章を飲み込まない', () => {
    expect(splitTextBlocks('前\n```js\n```\n後')).toEqual([
      { type: 'text', text: '前' },
      { type: 'code', language: 'js', code: '' },
      { type: 'text', text: '後' },
    ]);
  });

  test('CRLFでも行末に改行文字を残さない', () => {
    expect(splitTextBlocks('```css\r\n.a{}\r\n```')).toEqual([
      { type: 'code', language: 'css', code: '.a{}' },
    ]);
  });
});
