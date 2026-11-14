import {
  type BracketIndex,
  depthDelta,
  isIdentifier,
  isMemberAccess,
  isPunctuator,
  type Significant,
} from './js-token';

/**
 * `const g = self; g['kin' + 'tone']`のように、windowの別名を値として持ち出す書き方を検出します
 *
 * `self` / `top` / `parent` / `frames` / `opener`は変数名・引数名としてもよく使われるため、
 * その位置から見えるスコープで同じ名前が宣言されていれば、その変数とみなして数えない
 * (値としての持ち出しも、`self[...]`の計算プロパティも同じ)。
 *
 * - スコープは波括弧のブロックと、関数・メソッド・アロー関数・`catch`の引数で近似する
 * - `var`はいちばん内側の関数スコープへ、それ以外(`let` / `const` / `class` / `function`)はブロックへ宣言する
 *   (アセットは`"use strict"`で評価するため、ブロック内の関数宣言はブロックスコープ)
 * - 宣言より前の参照(`var`の巻き上げ、`let` / `const`の一時的デッドゾーン)もその変数とみなすため、
 *   判定は走査の最後に、各スコープの最終的な宣言で行う
 * - 走査は括弧の対応表を使った1回だけで、入れ子が深くても線形に終わる
 *
 * @see docs/13-launch-gate-and-permissions.md 3-4章
 */

const GLOBAL_ALIASES = new Set(['self', 'top', 'parent', 'frames', 'opener']);

/** 直後の識別子を宣言するキーワード */
const DECLARATION_KEYWORDS = new Set(['const', 'let', 'var', 'function', 'class']);

/** `(`の直前にあっても、関数・メソッドの引数リストを始めないキーワード */
const NON_FUNCTION_KEYWORDS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'with',
  'return',
  'typeof',
  'void',
  'delete',
  'await',
  'yield',
  'in',
  'of',
  'new',
  'case',
  'do',
  'else',
]);

type Scope = {
  /**
   * このスコープで宣言された名前
   *
   * 走査の途中だけで使う状態なので、宣言のたびにその場で追加する(作り直すと宣言数の二乗の時間がかかる)
   */
  names: Set<string>;
  /** このスコープの中の括弧の深さ。これより浅くなったら抜ける */
  depth: number;
  /** 波括弧の無いアロー関数の本体。同じ深さの`,` / `;`でも抜ける */
  endsAtSeparator: boolean;
  /** このスコープを含む関数の本体(`var`の宣言先)。自身が関数の本体なら`null` */
  functionScope: Scope | null;
  /** 外側のスコープ */
  parent: Scope | null;
};

type PendingParameters = { names: Set<string>; bodyIndex: number };

/** `(`が関数・アロー関数・メソッド・`catch`の引数リストなら、閉じ括弧の位置を返します */
const parameterListClose = (
  tokens: Significant[],
  open: number,
  brackets: BracketIndex
): number | null => {
  const close = brackets.get(open);
  if (close === undefined) {
    return null;
  }
  const previous = tokens[open - 1];
  const after = tokens[close + 1];
  const isArrow = isPunctuator(after, '=>');
  const isFunction =
    isIdentifier(previous, 'function') || isIdentifier(tokens[open - 2], 'function');
  // メソッド記法・クラスのメソッド・`catch (e) {`。制御構文の`if (…) {`などは除く
  const isMethodLike =
    isIdentifier(previous) &&
    !NON_FUNCTION_KEYWORDS.has(previous?.value ?? '') &&
    isPunctuator(after, '{');
  return isArrow || isFunction || isMethodLike ? close : null;
};

/** 既定値(`= …`)を読み飛ばし、次の`,`かパターンの閉じ括弧の位置を返します */
const skipDefaultValue = (
  tokens: Significant[],
  start: number,
  close: number,
  brackets: BracketIndex
): number => {
  let index = start;
  while (index < close && !isPunctuator(tokens[index], ',')) {
    const group = brackets.get(index);
    index = group === undefined ? index + 1 : group + 1;
  }
  return index;
};

/**
 * 分割代入のパターン(`{ … }` / `[ … ]`)で宣言される名前の位置を返します
 *
 * `{ a: b }`のキー`a`、計算プロパティのキー`{ [self]: b }`の`self`、既定値`{ a = self }`の`self`は宣言ではない
 * (式として、値の持ち出しの判定に残す)。
 * 入れ子のパターンは再帰せず、閉じ括弧のスタックで読む(深い入れ子でもスタックを溢れさせない)
 *
 * @param open パターンの開き括弧の位置
 */
const collectPatternBindings = (
  tokens: Significant[],
  open: number,
  brackets: BracketIndex
): number[] => {
  const outerClose = brackets.get(open);
  if (outerClose === undefined) {
    return [];
  }
  const bindings: number[] = [];
  const closes = [outerClose];
  let index = open + 1;
  while (closes.length > 0 && index < outerClose) {
    const close = closes[closes.length - 1] as number;
    if (index >= close) {
      closes.pop();
      index = close + 1;
      continue;
    }
    const token = tokens[index];
    const group = brackets.get(index);
    if (isPunctuator(token, '=')) {
      index = skipDefaultValue(tokens, index + 1, close, brackets);
    } else if (group !== undefined && isPunctuator(tokens[group + 1], ':')) {
      // `[expr]:` は計算プロパティのキー。パターンではなく式なので、中を宣言として読まない
      index = group + 1;
    } else if (group !== undefined && (isPunctuator(token, '{') || isPunctuator(token, '['))) {
      closes.push(group);
      index++;
    } else if (group !== undefined) {
      index = group + 1;
    } else {
      const next = tokens[index + 1];
      const isBinding =
        isIdentifier(token) &&
        (index + 1 === close ||
          isPunctuator(next, ',') ||
          isPunctuator(next, '=') ||
          isPunctuator(next, '}') ||
          isPunctuator(next, ']'));
      if (isBinding) bindings.push(index);
      index++;
    }
  }
  return bindings;
};

/** 引数リストで宣言された名前の位置を返します(分割代入の引数を含む) */
const parameterIndices = (
  tokens: Significant[],
  open: number,
  close: number,
  brackets: BracketIndex
): number[] => {
  const indices: number[] = [];
  let index = open + 1;
  while (index < close) {
    const nested = brackets.get(index);
    const previous = tokens[index - 1];
    if (nested !== undefined) {
      const isPattern =
        (isPunctuator(tokens[index], '{') || isPunctuator(tokens[index], '[')) &&
        (index === open + 1 || isPunctuator(previous, ',') || isPunctuator(previous, '...'));
      if (isPattern) indices.push(...collectPatternBindings(tokens, index, brackets));
      index = nested + 1;
      continue;
    }
    const next = tokens[index + 1];
    const isSimpleParameter =
      isIdentifier(tokens[index]) &&
      (index === open + 1 || isPunctuator(previous, ',') || isPunctuator(previous, '...')) &&
      (isPunctuator(next, ',') || isPunctuator(next, '=') || index + 1 === close);
    if (isSimpleParameter) indices.push(index);
    index++;
  }
  return indices;
};

/**
 * その位置の別名が、値として使われていれば検出名を返します
 *
 * 宣言・メンバー(`x.self`)・メンバーアクセスの起点(`self.x`)・代入先・オブジェクトのキーは値ではない
 */
const valueUsagePattern = (tokens: Significant[], index: number): string | null => {
  const name = tokens[index]?.value ?? '';
  const previous = tokens[index - 1];
  const next = tokens[index + 1];
  const isObjectKey =
    isPunctuator(next, ':') && (isPunctuator(previous, '{') || isPunctuator(previous, ','));
  const isDeclaration = isIdentifier(previous) && DECLARATION_KEYWORDS.has(previous?.value ?? '');
  if (
    isDeclaration ||
    isObjectKey ||
    isMemberAccess(previous) ||
    isMemberAccess(next) ||
    isPunctuator(next, '=') ||
    isPunctuator(next, '=>')
  ) {
    return null;
  }
  return isPunctuator(next, '[') ? `${name}[...]` : name;
};

type Candidate = { pattern: string; line: number; name: string; scope: Scope };

/** 引数リスト(または`x =>`)の始まりなら、引数名と本体の位置を返します */
const readParameters = (
  tokens: Significant[],
  index: number,
  brackets: BracketIndex
): { positions: number[]; bodyIndex: number } | null => {
  const token = tokens[index];
  const close = isPunctuator(token, '(') ? parameterListClose(tokens, index, brackets) : null;
  if (close !== null) {
    return { positions: parameterIndices(tokens, index, close, brackets), bodyIndex: close + 1 };
  }
  if (isIdentifier(token) && isPunctuator(tokens[index + 1], '=>')) {
    return { positions: [index], bodyIndex: index + 1 };
  }
  return null;
};

/** 波括弧のブロックと関数の本体をスタックで追います */
const createScopeTracker = (tokens: Significant[]) => {
  const scopes: Scope[] = [
    { names: new Set(), depth: 0, endsAtSeparator: false, functionScope: null, parent: null },
  ];
  let pending: PendingParameters | null = null;
  let depth = 0;

  const current = (): Scope => scopes[scopes.length - 1] as Scope;

  /** `kind`が`var`なら関数スコープへ、それ以外はいまのブロックへ宣言します */
  const declare = (name: string, kind: string) => {
    const scope = current();
    const target = kind === 'var' ? (scope.functionScope ?? scope) : scope;
    target.names.add(name);
  };

  /** トークンを1つ進め、括弧の深さとスコープの出入りを反映します */
  const advance = (token: Significant, index: number) => {
    depth += depthDelta(token);
    const waiting: PendingParameters | null = pending;
    if (waiting !== null && index === waiting.bodyIndex) {
      const isArrow = isPunctuator(token, '=>');
      if (isArrow && isPunctuator(tokens[index + 1], '{')) {
        pending = { ...waiting, bodyIndex: index + 1 };
      } else {
        scopes.push({
          names: waiting.names,
          depth,
          endsAtSeparator: isArrow,
          functionScope: null,
          parent: current(),
        });
        pending = null;
      }
    } else if (isPunctuator(token, '{')) {
      scopes.push({
        names: new Set(),
        depth,
        endsAtSeparator: false,
        functionScope: current().functionScope ?? current(),
        parent: current(),
      });
    }
    const isSeparator = isPunctuator(token, ',') || isPunctuator(token, ';');
    while (scopes.length > 1) {
      const top = current();
      const leaves =
        depth < top.depth || (top.endsAtSeparator && isSeparator && depth === top.depth);
      if (!leaves) break;
      scopes.pop();
    }
  };

  return {
    declare,
    advance,
    expectBody: (names: Set<string>, bodyIndex: number) => {
      pending = { names, bodyIndex };
    },
    /** いまのスコープ(後から宣言が足されても、同じ参照で最終的な宣言を読める) */
    current,
  };
};

/**
 * スコープとその外側のどこかで、名前が宣言されているかを判定する関数を返します
 *
 * 結果をスコープごとに覚え、外側へたどる回数を全体で線形に抑える
 * (候補ごとに外側を全てたどると、入れ子の深いコードで二乗の時間がかかる)
 */
const createShadowLookup = (name: string) => {
  const memo = new Map<Scope, boolean>();
  return (scope: Scope): boolean => {
    const path: Scope[] = [];
    let node: Scope | null = scope;
    while (node !== null && !memo.has(node)) {
      path.push(node);
      node = node.parent;
    }
    let shadowed = node === null ? false : (memo.get(node) ?? false);
    for (const unresolved of path.reverse()) {
      shadowed = shadowed || unresolved.names.has(name);
      memo.set(unresolved, shadowed);
    }
    return shadowed;
  };
};

/** windowの別名を値として持ち出している位置を返します */
export const detectGlobalAliasValues = (
  tokens: Significant[],
  brackets: BracketIndex
): { pattern: string; line: number }[] => {
  const tracker = createScopeTracker(tokens);
  const bindingPositions = new Set<number>();
  const candidates: Candidate[] = [];

  tokens.forEach((token, index) => {
    const parameters = readParameters(tokens, index, brackets);
    if (parameters !== null) {
      for (const position of parameters.positions) bindingPositions.add(position);
      const names = parameters.positions.map((position) => tokens[position]?.value ?? '');
      tracker.expectBody(new Set(names), parameters.bodyIndex);
    }

    const previous = tokens[index - 1];
    const kind = isIdentifier(previous) ? (previous?.value ?? '') : '';
    if (isIdentifier(token) && DECLARATION_KEYWORDS.has(kind)) {
      tracker.declare(token.value, kind);
    } else if (
      (isPunctuator(token, '{') || isPunctuator(token, '[')) &&
      (kind === 'const' || kind === 'let' || kind === 'var')
    ) {
      // `const { self } = x`のような分割代入での宣言
      for (const position of collectPatternBindings(tokens, index, brackets)) {
        bindingPositions.add(position);
        tracker.declare(tokens[position]?.value ?? '', kind);
      }
    }

    const pattern =
      isIdentifier(token) && GLOBAL_ALIASES.has(token.value) && !bindingPositions.has(index)
        ? valueUsagePattern(tokens, index)
        : null;
    if (pattern !== null) {
      // 判定は走査の後。宣言より前の参照(巻き上げ)も、スコープの最終的な宣言で判定する
      candidates.push({ pattern, line: token.line, name: token.value, scope: tracker.current() });
    }

    tracker.advance(token, index);
  });

  const lookups = new Map([...GLOBAL_ALIASES].map((name) => [name, createShadowLookup(name)]));
  return candidates
    .filter((candidate) => !lookups.get(candidate.name)?.(candidate.scope))
    .map(({ pattern, line }) => ({ pattern, line }));
};
