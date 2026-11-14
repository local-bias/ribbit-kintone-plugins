import { describe, expect, test } from 'vitest';
import {
  type InspectableElement,
  inspectDom,
  isAllowedSelector,
  MAX_DOM_LIMIT,
  toTextShape,
} from './dom-inspector';

type FakeOptions = {
  id?: string;
  classes?: string[];
  role?: string;
  text?: string;
  value?: string;
  children?: FakeElement[];
  inPluginRoot?: boolean;
};

type FakeElement = InspectableElement & { inPluginRoot: boolean };

const el = (tagName: string, options: FakeOptions = {}): FakeElement => {
  const element: FakeElement = {
    tagName,
    id: options.id ?? '',
    classList: options.classes ?? [],
    children: options.children ?? [],
    parentElement: null,
    textContent: options.text ?? null,
    inPluginRoot: options.inPluginRoot ?? false,
    getAttribute: (name) =>
      name === 'role' ? (options.role ?? null) : name === 'value' ? (options.value ?? null) : null,
    closest: () => (element.inPluginRoot ? element : null),
  };
  for (const child of options.children ?? []) child.parentElement = element;
  return element;
};

const root = (matched: InspectableElement[] | 'throw') => ({
  querySelectorAll: () => {
    if (matched === 'throw') throw new SyntaxError('bad selector');
    return matched;
  },
});

const inspect = (matched: InspectableElement[] | 'throw', extra = {}) =>
  inspectDom({
    root: root(matched),
    selector: 'tr',
    excludedRootSelector: '#plugin-root',
    getComputedStyle: () => ({
      getPropertyValue: (name) => (name === 'display' ? 'table-row' : ''),
    }),
    ...extra,
  });

describe('inspectDom', () => {
  test('構造・祖先・文字種を返し、テキストや属性の値は返さない', () => {
    const row = el('TR', {
      classes: ['recordlist-row-gaia'],
      role: 'row',
      text: '株式会社サンプル 12345',
      value: '秘密の値',
      children: Array.from({ length: 6 }, () => el('TD', { classes: ['cell'] })),
    });
    const table = el('TABLE', { classes: ['recordlist-gaia'], children: [row] });
    el('BODY', { children: [el('DIV', { classes: ['container-gaia'], children: [table] })] });

    const result = inspect([row]);
    expect(result).toEqual({
      count: 1,
      truncated: false,
      samples: [
        {
          tagName: 'TR',
          id: '',
          classList: ['recordlist-row-gaia'],
          role: 'row',
          structure: 'TR.recordlist-row-gaia > TD.cell × 6',
          textShape: { length: 14, fullWidth: 8, alphabet: 0, digit: 5, space: 1, other: 0 },
          ancestors: ['BODY', 'DIV.container-gaia', 'TABLE.recordlist-gaia'],
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('サンプル');
    expect(JSON.stringify(result)).not.toContain('秘密の値');
  });

  test('本プラグインのUIとスクリプト・スタイルは探索から外す', () => {
    const result = inspect([el('DIV', { inPluginRoot: true }), el('STYLE'), el('SPAN')]);
    expect(result).toMatchObject({ count: 1, samples: [{ tagName: 'SPAN' }] });
  });

  test('件数の上限と、計算済みスタイル', () => {
    const many = Array.from({ length: 20 }, () => el('TD'));
    const result = inspect(many, { limit: 50, includeComputedStyle: true });
    if ('error' in result) throw new Error('unexpected');
    expect(result.samples).toHaveLength(MAX_DOM_LIMIT);
    expect(result.count).toBe(20);
    expect(result.truncated).toBe(false);
    expect(result.samples[0]?.computedStyle?.display).toBe('table-row');
  });

  test('結果の総量を8KBで打ち切る', () => {
    const wide = Array.from({ length: 10 }, () =>
      el('DIV', {
        classes: Array.from({ length: 10 }, (_, i) => `class-name-that-is-long-${i}`.repeat(4)),
      })
    );
    const result = inspect(wide, { limit: 10 });
    if ('error' in result) throw new Error('unexpected');
    expect(result.truncated).toBe(true);
    expect(new TextEncoder().encode(JSON.stringify(result.samples)).length).toBeLessThanOrEqual(
      8192
    );
  });

  test('不正なセレクタはエラーとして返す(例外にしない)', () => {
    expect(inspect('throw')).toEqual({ error: 'invalid-selector' });
  });
});

describe('toTextShape', () => {
  test('連続する空白はまとめて数える', () => {
    expect(toTextShape('  a  b\n1 ')).toEqual({
      length: 5,
      fullWidth: 0,
      alphabet: 2,
      digit: 1,
      space: 2,
      other: 0,
    });
  });
});

describe('isAllowedSelector', () => {
  test.each([
    'tr.recordlist-row-gaia > td',
    '#record-gaia .control-value-gaia',
    'div[class~="x"]',
    '[role="row"]:nth-child(2n+1)',
    'li:not(.a):first-child',
    'tr:has(> td.x)',
    '.a\\:b',
  ])('構造だけを見るセレクタは許す: %s', (selector) => {
    expect(isAllowedSelector(selector)).toBe(true);
  });

  test.each([
    'input[value^="山"]',
    'td[title*="A社"]',
    'a[href*="secret"]',
    '[data-x]',
    'tr:has([value="1"])',
    'input:checked',
    'input:placeholder-shown',
    'p::before',
    '[v\\61lue^="x"]',
    '[class="a]"][value="b"]',
    'div[class',
  ])('返さない値や状態を推測させるセレクタは拒否する: %s', (selector) => {
    expect(isAllowedSelector(selector)).toBe(false);
  });

  test('拒否したセレクタは問い合わせずにエラーを返す', () => {
    const querySelectorAll = () => {
      throw new Error('must not query');
    };
    expect(
      inspectDom({
        root: { querySelectorAll },
        selector: 'input[value^="a"]',
        excludedRootSelector: '#x',
        getComputedStyle: () => ({ getPropertyValue: () => '' }),
      })
    ).toEqual({ error: 'unsupported-selector' });
  });
});
