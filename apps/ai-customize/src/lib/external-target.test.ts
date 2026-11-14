import { describe, expect, test } from 'vitest';
import { MAX_EXTERNAL_PATTERNS } from './constants';
import {
  appendExternalPattern,
  describeExternalTarget,
  listExternalUrlLines,
  matchExternalTarget,
  normalizeExternalPattern,
  parseExternalPatterns,
  removeExternalLine,
} from './external-target';

describe('normalizeExternalPattern', () => {
  test.each([
    ['https://API.Example.com', 'https://api.example.com/'],
    ['https://api.example.com:443/v1/', 'https://api.example.com/v1/'],
    ['https://api.example.com/v1', 'https://api.example.com/v1'],
    ['https://api.example.com/v1/../v2/', 'https://api.example.com/v2/'],
    ['https://例え.jp/api', 'https://xn--r8jz45g.jp/api'],
    ['  https://api.example.com/  ', 'https://api.example.com/'],
  ])('%s は %s へ正規化される', (raw, expected) => {
    expect(normalizeExternalPattern(raw)).toEqual({ ok: true, pattern: expected, insecure: false });
  });

  test('http: は有効だが暗号化されない通信として印を付ける', () => {
    expect(normalizeExternalPattern('http://api.example.com')).toEqual({
      ok: true,
      pattern: 'http://api.example.com/',
      insecure: true,
    });
  });

  test.each([
    ['https://*.example.com', 'wildcard'],
    ['https://api.example.com/?key=1', 'query'],
    ['https://api.example.com/?', 'query'],
    ['https://api.example.com/#top', 'fragment'],
    ['https://user:pass@api.example.com', 'userinfo'],
    ['https://user@api.example.com', 'userinfo'],
    ['ftp://api.example.com', 'unsupported-scheme'],
    ['javascript:alert(1)', 'unsupported-scheme'],
    ['api.example.com', 'invalid-url'],
    ['/relative/path', 'invalid-url'],
    [`https://api.example.com/${'a'.repeat(3000)}`, 'too-long'],
  ])('%s は無効(%s)', (raw, reason) => {
    expect(normalizeExternalPattern(raw)).toEqual({ ok: false, reason });
  });
});

describe('parseExternalPatterns', () => {
  test('空行と#で始まる行を無視し、行番号を保つ', () => {
    const result = parseExternalPatterns(
      ['# 郵便番号API', 'https://zipcloud.ibsnet.co.jp/api/', '', 'https://bad/?q'].join('\n')
    );
    expect(result.patterns).toEqual(['https://zipcloud.ibsnet.co.jp/api/']);
    expect(result.invalid).toEqual([{ line: 4, raw: 'https://bad/?q', reason: 'query' }]);
  });

  test('重複したパターンは1つにまとめる', () => {
    const result = parseExternalPatterns('https://a.example.com\r\nhttps://A.example.com/');
    expect(result.patterns).toEqual(['https://a.example.com/']);
  });

  test('http: には警告を付ける', () => {
    expect(parseExternalPatterns('http://a.example.com').warnings).toEqual([
      { line: 1, pattern: 'http://a.example.com/', reason: 'insecure' },
    ]);
  });

  test('上限を超えた行は無効として理由を残す', () => {
    const lines = Array.from(
      { length: MAX_EXTERNAL_PATTERNS + 2 },
      (_, index) => `https://host${index}.example.com`
    );
    const result = parseExternalPatterns(lines.join('\n'));
    expect(result.patterns).toHaveLength(MAX_EXTERNAL_PATTERNS);
    expect(result.invalid.map((entry) => entry.reason)).toEqual(['too-many', 'too-many']);
  });
});

describe('matchExternalTarget', () => {
  const patterns = ['https://api.example.com/v1/', 'https://fonts.example.com/'];

  test.each([
    ['https://api.example.com/v1', true],
    ['https://api.example.com/v1/', true],
    ['https://api.example.com/v1/zip?code=1000001', true],
    ['https://api.example.com/v1/a/b', true],
    ['https://fonts.example.com/css2?family=Noto', true],
    ['https://API.EXAMPLE.COM/v1/zip', true],
    ['https://api.example.com:443/v1/zip', true],
    // パスのはみ出し
    ['https://api.example.com/v10', false],
    ['https://api.example.com/v1evil', false],
    ['https://api.example.com/v2/zip', false],
    ['https://api.example.com/v1/../admin', false],
    ['https://api.example.com/v1/%2e%2e/admin', false],
    // オリジンの偽装
    ['https://api.example.com.evil.example/v1/', false],
    ['https://evil.example/https://api.example.com/v1/', false],
    ['https://api.example.com@evil.example/v1/', false],
    ['https://user:pass@api.example.com/v1/', false],
    // スキーム・ポート違い
    ['http://api.example.com/v1/', false],
    ['https://api.example.com:8443/v1/', false],
    // 絶対URLでない・解釈できない
    ['/v1/zip', false],
    ['//api.example.com/v1/', false],
    ['javascript:alert(1)', false],
    ['not a url', false],
  ])('%s -> %s', (target, expected) => {
    expect(matchExternalTarget(target, patterns)).toBe(expected);
  });

  test('パス / のパターンはオリジン全体に一致する', () => {
    expect(matchExternalTarget('https://fonts.example.com/any/path', patterns)).toBe(true);
  });

  test('パターンが空なら常に一致しない', () => {
    expect(matchExternalTarget('https://api.example.com/v1/', [])).toBe(false);
  });
});

describe('describeExternalTarget', () => {
  test('クエリとフラグメントを出さない', () => {
    expect(describeExternalTarget('https://api.example.com/v1/zip?name=secret#x')).toBe(
      'https://api.example.com/v1/zip'
    );
  });
});

describe('listExternalUrlLines', () => {
  test('コメントと空行を除き、元の行番号と正規化結果を返す', () => {
    const lines = listExternalUrlLines(
      '# 郵便番号\nhttps://zipcloud.ibsnet.co.jp/api\n\nhttps://*.example.com'
    );
    expect(lines).toEqual([
      {
        line: 2,
        raw: 'https://zipcloud.ibsnet.co.jp/api',
        result: { ok: true, pattern: 'https://zipcloud.ibsnet.co.jp/api', insecure: false },
      },
      { line: 4, raw: 'https://*.example.com', result: { ok: false, reason: 'wildcard' } },
    ]);
  });
});

describe('appendExternalPattern', () => {
  test('正規化した形で末尾に追加し、コメントは残す', () => {
    expect(
      appendExternalPattern('# api\nhttps://a.example.com/v1\n\n', 'https://B.example.com')
    ).toEqual({
      ok: true,
      text: '# api\nhttps://a.example.com/v1\nhttps://b.example.com/',
      pattern: 'https://b.example.com/',
    });
    expect(appendExternalPattern('', 'https://a.example.com/x')).toMatchObject({
      text: 'https://a.example.com/x',
    });
  });

  test('無効なパターンと、既にある通信先は追加しない', () => {
    expect(appendExternalPattern('', 'https://a.example.com/?q=1')).toEqual({
      ok: false,
      reason: 'query',
    });
    expect(appendExternalPattern('https://a.example.com/', 'https://A.example.com')).toEqual({
      ok: false,
      reason: 'duplicate',
    });
  });

  test('上限に達していたら追加しない', () => {
    const text = Array.from(
      { length: MAX_EXTERNAL_PATTERNS },
      (_, i) => `https://h${i}.example.com/`
    ).join('\n');
    expect(appendExternalPattern(text, 'https://new.example.com')).toEqual({
      ok: false,
      reason: 'too-many',
    });
  });
});

describe('removeExternalLine', () => {
  test('指定した行だけを取り除く', () => {
    expect(removeExternalLine('# c\nhttps://a.example.com/\nhttps://b.example.com/', 2)).toBe(
      '# c\nhttps://b.example.com/'
    );
  });

  test('範囲外の行番号なら変えない', () => {
    expect(removeExternalLine('https://a.example.com/', 5)).toBe('https://a.example.com/');
    expect(removeExternalLine('https://a.example.com/', 0)).toBe('https://a.example.com/');
  });
});
