import { describe, expect, test } from 'vitest';
import { detectCssExternalReferences } from './css-detector';

const ORIGIN = 'https://example.cybozu.com';

describe('detectCssExternalReferences', () => {
  test('url() / @import / image-set() の外部参照を行番号つきで返す', () => {
    const css = [
      "@import 'https://fonts.example.com/css2?family=Noto';",
      '@import url("https://cdn.example.com/base.css");',
      '.a { background: url(https://img.example.com/a.png); }',
      '.b { background-image: image-set("https://img.example.com/b.avif" type("image/avif"), "/b.png" 1x); }',
      "@font-face { font-family: X; src: url('//fonts.example.com/x.woff2'); }",
    ].join('\n');
    expect(detectCssExternalReferences(css, ORIGIN)).toEqual([
      { target: 'https://fonts.example.com/css2?family=Noto', line: 1 },
      { target: 'https://cdn.example.com/base.css', line: 2 },
      { target: 'https://img.example.com/a.png', line: 3 },
      { target: 'https://img.example.com/b.avif', line: 4 },
      { target: 'https://fonts.example.com/x.woff2', line: 5 },
    ]);
  });

  test.each([
    '.a { background: url(/k/static/a.png); }',
    '.a { background: url(./a.png); }',
    `.a { background: url(${ORIGIN}/k/a.png); }`,
    '.a { background: url("data:image/png;base64,AAAA"); }',
    '.a { filter: url(#blur); }',
    '@namespace svg url(http://www.w3.org/2000/svg);',
    '.a { content: "\\201C"; }',
    '/* url(https://evil.example/a.png) */ .a { color: red; }',
    '.a { content: "url(https://evil.example/a.png)"; }',
  ])('外部通信に数えない: %s', (css) => {
    expect(detectCssExternalReferences(css, ORIGIN)).toEqual([]);
  });

  test('http(s)以外のスキームは送信先を判定できない参照にする', () => {
    expect(
      detectCssExternalReferences('.a { background: url(javascript:alert(1)); }', ORIGIN)
    ).toEqual([{ target: null, line: 1 }]);
  });

  test('文字列の外のエスケープは送信先を判定できない参照にする', () => {
    const css = '.a { background: u\\72l(https://evil.example/a.png); }';
    expect(detectCssExternalReferences(css, ORIGIN)).toContainEqual({ target: null, line: 1 });
  });

  test('url() 内のエスケープは送信先を判定できない参照にする', () => {
    const css = '.a { background: url("https://ev\\69l.example/a.png"); }';
    expect(detectCssExternalReferences(css, ORIGIN)).toEqual([{ target: null, line: 1 }]);
  });

  test('大文字の URL( も検出する', () => {
    expect(
      detectCssExternalReferences('.a { background: URL(https://x.example/a.png) }', ORIGIN)
    ).toEqual([{ target: 'https://x.example/a.png', line: 1 }]);
  });

  test('識別子の一部としての url( は検出しない', () => {
    expect(detectCssExternalReferences('.a { --my-url(x) }', ORIGIN)).toEqual([]);
  });
});
