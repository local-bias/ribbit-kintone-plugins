import { describe, expect, test } from 'vitest';
import { type CodeValidationInput, validateAssetCode } from './code-validator';
import { MAX_CODE_BYTES } from './constants';

const ORIGIN = 'https://example.cybozu.com';

const validate = (overrides: Partial<CodeValidationInput>) =>
  validateAssetCode({
    kind: 'js',
    code: '',
    permissions: [],
    externalUrls: [],
    origin: ORIGIN,
    checkJsSyntax: () => null,
    ...overrides,
  });

const js = (...lines: string[]) => lines.join('\n');

describe('validateAssetCode', () => {
  test('読み取りだけのJSは問題なし', () => {
    const result = validate({
      code: js(
        "kintone.events.on('app.record.index.show', (event) => {",
        "  return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', {}).then(() => event);",
        '});'
      ),
    });
    expect(result).toEqual({ errors: [], warnings: [], externalUrls: [] });
  });

  test('空のコードは拒否する', () => {
    expect(validate({ code: '  \n ' }).errors).toEqual([{ type: 'empty' }]);
  });

  test('上限を超えるコードは走査せずに拒否する', () => {
    const result = validate({ code: 'a'.repeat(MAX_CODE_BYTES + 1) });
    expect(result.errors).toEqual([{ type: 'too-large', bytes: MAX_CODE_BYTES + 1 }]);
  });

  test('見えない文字(双方向の制御文字・ゼロ幅文字・U+2028)は、JSでもCSSでも拒否する', () => {
    const code = ['const ok = 1;', 'const a = "\u202E";', '// x\u2028y', 'b\u200B();'].join('\n');
    expect(validate({ code }).errors).toContainEqual({
      type: 'invisible-characters',
      lines: [2, 3, 4],
    });
    expect(validate({ kind: 'css', code: '.a\u200B { color: red; }' }).errors).toEqual([
      { type: 'invisible-characters', lines: [1] },
    ]);
  });

  test('構文エラーは説明つきで拒否する', () => {
    const result = validate({ code: 'const = ;', checkJsSyntax: () => 'Unexpected token' });
    expect(result.errors).toContainEqual({ type: 'syntax', message: 'Unexpected token' });
  });

  test('迂回パターンは行番号つきで拒否する', () => {
    const result = validate({ code: js('const a = 1;', "fetch('/k/v1/record.json');") });
    expect(result.errors).toContainEqual({ type: 'bypass', pattern: 'fetch', line: 2 });
  });

  test('使っているのに宣言していない権限は拒否する', () => {
    const result = validate({
      code: js(
        "kintone.api('/k/v1/record.json', 'PUT', {});",
        "kintone.api('/k/v1/record.json', 'DELETE', {});"
      ),
      permissions: ['put'],
    });
    expect(result.errors).toEqual([
      { type: 'missing-permission', permission: 'delete', lines: [2] },
    ]);
  });

  test('ファイルのアップロードは追加・更新のどちらかを宣言していればよい', () => {
    const code = "kintone.api('/k/v1/file.json', 'POST', {});";
    expect(validate({ code, permissions: ['put'] }).errors).toEqual([]);
    expect(validate({ code, permissions: [] }).errors).toEqual([
      { type: 'missing-permission', permission: 'post', lines: [1] },
      { type: 'missing-permission', permission: 'put', lines: [1] },
    ]);
  });

  test('宣言しているのに使っていない権限は警告する', () => {
    const result = validate({ code: 'const a = 1;', permissions: ['post'] });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([{ type: 'unused-permission', permission: 'post' }]);
  });

  test('メソッドが変数のkintone.apiは、実行時に判定する旨を警告する(未使用の警告は出さない)', () => {
    const result = validate({
      code: "kintone.api('/k/v1/record.json', method, {});",
      permissions: ['put'],
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([{ type: 'dynamic-api', lines: [1] }]);
  });

  test('アプリ設定の変更など「制限なし」が要る呼び出しは拒否する', () => {
    const result = validate({
      code: "kintone.api('/k/v1/preview/app/form/fields.json', 'PUT', {});",
      permissions: ['put'],
    });
    expect(result.errors).toContainEqual({ type: 'requires-unrestricted', lines: [1] });
  });

  test('一括の更新・削除と bulkRequest は警告する', () => {
    const result = validate({
      code: js(
        "kintone.api('/k/v1/records.json', 'PUT', {});",
        "kintone.api('/k/v1/records.json', 'GET', {});",
        "kintone.api('/k/v1/bulkRequest.json', 'POST', {});"
      ),
      permissions: ['put', 'post'],
    });
    expect(result.warnings).toContainEqual({ type: 'bulk-operation', lines: [1, 3] });
  });

  test('認証情報らしき文字列を警告する', () => {
    const result = validate({
      code: js(
        "const headers = { 'X-Cybozu-API-Token': token };",
        "const key = 'sk1234567890abcdefghijklmnopqrstuvwxyz';",
        "const label = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';"
      ),
    });
    expect(result.warnings).toContainEqual({ type: 'credential', lines: [1, 2] });
  });

  describe('外部通信', () => {
    test('文字列で書いた送信先が通信先に無ければ拒否する', () => {
      const result = validate({
        code: "kintone.proxy('https://api.example.com/v1/zip?code=1', 'GET', {}, {});",
        externalUrls: ['https://other.example.com/'],
      });
      expect(result.errors).toEqual([
        { type: 'unregistered-target', target: 'https://api.example.com/v1/zip', lines: [1] },
      ]);
      expect(result.warnings).toEqual([
        { type: 'unused-external-url', pattern: 'https://other.example.com/' },
      ]);
    });

    test('一致すれば通し、通信先は正規化して重複を除く', () => {
      const result = validate({
        code: "kintone.proxy('https://api.example.com/v1/zip', 'GET', {}, {});",
        externalUrls: ['https://api.example.com/v1', 'https://API.example.com/v1'],
      });
      expect(result).toEqual({
        errors: [],
        warnings: [],
        externalUrls: ['https://api.example.com/v1'],
      });
    });

    test('無効な通信先は理由つきで拒否する', () => {
      const result = validate({ code: 'const a = 1;', externalUrls: ['https://*.example.com/'] });
      expect(result.errors).toEqual([
        { type: 'invalid-external-url', raw: 'https://*.example.com/', reason: 'wildcard' },
      ]);
    });

    test('組み立てた送信先の読み込みは「指定先のみ」で実行されないため拒否する', () => {
      const result = validate({
        code: "img.src = 'https://img.example.com/' + name;",
        externalUrls: ['https://img.example.com/'],
      });
      expect(result.errors).toEqual([{ type: 'dynamic-resource', lines: [1] }]);
    });

    test('組み立てた送信先のkintone.proxyは、実行時に判定する旨を警告する', () => {
      const result = validate({
        code: "kintone.proxy(base + '/zip', 'GET', {}, {});",
        externalUrls: ['https://api.example.com/'],
      });
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([{ type: 'dynamic-external', lines: [1] }]);
    });

    test('http: の通信先は警告する', () => {
      const result = validate({
        code: "kintone.proxy('http://api.example.com/', 'GET', {}, {});",
        externalUrls: ['http://api.example.com/'],
      });
      expect(result.warnings).toEqual([
        { type: 'insecure-external-url', pattern: 'http://api.example.com/' },
      ]);
    });

    test('CSSの外部url()も同じ基準で照合する。構文検査と権限の照合はしない', () => {
      const code =
        "@import url('https://fonts.googleapis.com/css2?family=Noto');\n.a { color: red; }";
      expect(
        validate({ kind: 'css', code, checkJsSyntax: () => 'should not be called' }).errors
      ).toEqual([
        {
          type: 'unregistered-target',
          target: 'https://fonts.googleapis.com/css2',
          lines: [1],
        },
      ]);
      expect(
        validate({ kind: 'css', code, externalUrls: ['https://fonts.googleapis.com/'] }).errors
      ).toEqual([]);
    });
  });
});
