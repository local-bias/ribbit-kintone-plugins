/**
 * `query_dom`: 現在の画面から、CSSセレクタに一致する要素の構造を調べます
 *
 * 業務データを送らないため、生の`outerHTML`や属性値は返さない。属性は`id` / `class` / `role`だけ、
 * テキストは文字種ごとの文字数に置き換える。結果の総量は8KBで打ち切る
 *
 * @see docs/07-ai-tools.md 4-5章、docs/11-decisions.md Q6
 */

/** 調べるのに使うDOMの最小限の形(テストでは偽物を渡す) */
export type InspectableElement = {
  tagName: string;
  id: string;
  classList: Iterable<string>;
  children: ArrayLike<InspectableElement>;
  parentElement: InspectableElement | null;
  textContent: string | null;
  getAttribute: (name: string) => string | null;
  closest: (selector: string) => InspectableElement | null;
};

export type InspectableRoot = {
  querySelectorAll: (selector: string) => ArrayLike<InspectableElement>;
};

export type TextShape = {
  length: number;
  fullWidth: number;
  alphabet: number;
  digit: number;
  space: number;
  other: number;
};

export type DomSample = {
  tagName: string;
  id: string;
  classList: string[];
  role?: string;
  /** 子要素の並び(`TD.cell × 6`のように、連続する同じ形をまとめる) */
  structure: string;
  textShape: TextShape;
  /** 近い祖先から最大6つ(外側から内側の順) */
  ancestors: string[];
  computedStyle?: Record<string, string>;
};

export type DomQueryResult =
  | {
      count: number;
      samples: DomSample[];
      /** 結果の大きさ(8KB)の上限で、サンプルを途中で打ち切った */
      truncated: boolean;
    }
  | { error: 'invalid-selector' | 'unsupported-selector' };

export const DEFAULT_DOM_LIMIT = 3;
export const MAX_DOM_LIMIT = 10;
export const MAX_DOM_RESULT_BYTES = 8 * 1024;
const MAX_ANCESTORS = 6;
const MAX_STRUCTURE_GROUPS = 10;
const MAX_CLASSES = 10;

/** 探索から外す要素(本プラグイン自身のUIと、スタイル・スクリプト) */
const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE']);

/** CSSを書くのに効く、計算済みスタイルのプロパティ */
const STYLE_PROPERTIES = [
  'display',
  'position',
  'visibility',
  'color',
  'background-color',
  'font-size',
  'font-weight',
  'width',
  'height',
  'margin',
  'padding',
  'border',
] as const;

const encoder = new TextEncoder();

/** 返す`id` / `class` / `role`の1つあたりの長さの上限(長い値で指示を紛れ込ませない) */
const MAX_NAME_LENGTH = 100;

/** セレクタで値を比べてよい属性。結果にも値を返すものだけ(他の属性の値を一致件数から推測させない) */
const ALLOWED_ATTRIBUTES = new Set(['id', 'class', 'role']);

/** 使ってよい疑似クラス(構造だけを見るもの)。入力の状態や値を見るもの(`:checked`など)は使わせない */
const ALLOWED_PSEUDO_CLASSES = new Set([
  'first-child',
  'last-child',
  'only-child',
  'first-of-type',
  'last-of-type',
  'only-of-type',
  'nth-child',
  'nth-last-child',
  'nth-of-type',
  'nth-last-of-type',
  'not',
  'is',
  'where',
  'has',
  'root',
  'scope',
]);

/** 属性セレクタの閉じ`]`の位置(引用符の中の`]`は数えない)。見つからなければ-1 */
const findAttributeEnd = (selector: string, start: number): number => {
  let quote: string | null = null;
  for (let index = start; index < selector.length; index += 1) {
    const char = selector[index];
    if (char === '\\') {
      index += 1;
    } else if (quote !== null) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ']') {
      return index;
    }
  }
  return -1;
};

/**
 * セレクタが、返さない情報(他の属性の値・入力の状態)を一致件数から推測させる形でないか確かめます
 *
 * 属性セレクタの属性名は`id` / `class` / `role`だけ、疑似クラスは構造を見るものだけを許す。
 * `:has()`などの中も同じ規則で調べる。エスケープした名前は許可リストと一致しないため拒否される
 */
export const isAllowedSelector = (selector: string): boolean => {
  let index = 0;
  while (index < selector.length) {
    const char = selector[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '"' || char === "'") {
      // 属性セレクタの外の引用符は、正しいセレクタには現れない
      return false;
    }
    if (char === '[') {
      const end = findAttributeEnd(selector, index + 1);
      if (end === -1) return false;
      const name = /^\s*([A-Za-z-]+)\s*(?:[~|^$*]?=|\])/.exec(
        selector.slice(index + 1, end + 1)
      )?.[1];
      if (name === undefined || !ALLOWED_ATTRIBUTES.has(name.toLowerCase())) return false;
      index = end + 1;
      continue;
    }
    if (char === ':') {
      if (selector[index + 1] === ':') return false;
      const name = /^[A-Za-z-]+/.exec(selector.slice(index + 1))?.[0];
      if (name === undefined || !ALLOWED_PSEUDO_CLASSES.has(name.toLowerCase())) return false;
      index += 1 + name.length;
      continue;
    }
    index += 1;
  }
  return true;
};

const limitName = (value: string): string =>
  value.length > MAX_NAME_LENGTH ? `${value.slice(0, MAX_NAME_LENGTH)}…` : value;

const describeElement = (element: InspectableElement): string => {
  const classes = [...element.classList].slice(0, 3);
  return [
    element.tagName,
    element.id === '' ? '' : `#${element.id}`,
    ...classes.map((name) => `.${name}`),
  ].join('');
};

const summarizeChildren = (element: InspectableElement): string => {
  const groups: { label: string; count: number }[] = [];
  for (const child of Array.from(element.children)) {
    const label = describeElement(child);
    const last = groups.at(-1);
    if (last?.label === label) last.count += 1;
    else groups.push({ label, count: 1 });
  }
  const parts = groups
    .slice(0, MAX_STRUCTURE_GROUPS)
    .map(({ label, count }) => (count > 1 ? `${label} × ${count}` : label));
  if (groups.length > MAX_STRUCTURE_GROUPS) parts.push('…');
  const inner = parts.join(', ');
  return inner === '' ? describeElement(element) : `${describeElement(element)} > ${inner}`;
};

/** テキストを、文字種ごとの文字数へ置き換えます(値そのものは返さない) */
export const toTextShape = (text: string): TextShape => {
  const shape: TextShape = { length: 0, fullWidth: 0, alphabet: 0, digit: 0, space: 0, other: 0 };
  for (const char of text.replace(/\s+/g, ' ').trim()) {
    shape.length += 1;
    if (/\s/.test(char)) shape.space += 1;
    else if (/[0-9]/.test(char)) shape.digit += 1;
    else if (/[A-Za-z]/.test(char)) shape.alphabet += 1;
    else if (char.charCodeAt(0) > 0x7f) shape.fullWidth += 1;
    else shape.other += 1;
  }
  return shape;
};

const listAncestors = (element: InspectableElement): string[] => {
  const ancestors: string[] = [];
  let current = element.parentElement;
  while (current !== null && ancestors.length < MAX_ANCESTORS) {
    ancestors.unshift(describeElement(current));
    current = current.parentElement;
  }
  return ancestors;
};

const isExcluded = (element: InspectableElement, excludedRootSelector: string): boolean =>
  EXCLUDED_TAGS.has(element.tagName) || element.closest(excludedRootSelector) !== null;

export const inspectDom = (params: {
  root: InspectableRoot;
  selector: string;
  limit?: number;
  includeComputedStyle?: boolean;
  /** 本プラグインのUIのルート(探索結果から外す) */
  excludedRootSelector: string;
  getComputedStyle: (element: InspectableElement) => { getPropertyValue: (name: string) => string };
}): DomQueryResult => {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_DOM_LIMIT, 1), MAX_DOM_LIMIT);
  if (!isAllowedSelector(params.selector)) {
    return { error: 'unsupported-selector' };
  }
  let matched: InspectableElement[];
  try {
    matched = Array.from(params.root.querySelectorAll(params.selector));
  } catch {
    return { error: 'invalid-selector' };
  }
  const elements = matched.filter((element) => !isExcluded(element, params.excludedRootSelector));

  const samples: DomSample[] = [];
  let truncated = false;
  for (const element of elements.slice(0, limit)) {
    const role = element.getAttribute('role');
    const sample: DomSample = {
      tagName: element.tagName,
      id: limitName(element.id),
      classList: [...element.classList].slice(0, MAX_CLASSES).map(limitName),
      ...(role === null || role === '' ? {} : { role: limitName(role) }),
      structure: summarizeChildren(element),
      textShape: toTextShape(element.textContent ?? ''),
      ancestors: listAncestors(element),
    };
    if (params.includeComputedStyle) {
      const style = params.getComputedStyle(element);
      sample.computedStyle = Object.fromEntries(
        STYLE_PROPERTIES.map((name) => [name, style.getPropertyValue(name)])
      );
    }
    const size = encoder.encode(JSON.stringify([...samples, sample])).length;
    if (size > MAX_DOM_RESULT_BYTES) {
      truncated = true;
      break;
    }
    samples.push(sample);
  }
  return {
    count: elements.length,
    samples,
    truncated,
  };
};
