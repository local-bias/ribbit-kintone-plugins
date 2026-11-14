/**
 * 2つのコードの行単位の差分(純粋関数)
 *
 * 承認カードで、既存のコードとAIが提案したコードの違いを見せるために使う。
 * 共通の先頭・末尾を除いた残りをLCSで比べる。比べる行が多すぎるとき(時間とメモリを抑えるため)は、
 * 残りを「全て削除して全て追加」として返す(差分としては粗いが、承認する内容は全て見える)
 *
 * @see docs/07-ai-tools.md 5章
 */

export type DiffLine =
  | { type: 'same'; text: string; before: number; after: number }
  | { type: 'removed'; text: string; before: number }
  | { type: 'added'; text: string; after: number };

/** LCSの表の大きさの上限(行数の積) */
export const MAX_DIFF_CELLS = 4_000_000;

const splitLines = (code: string): string[] => code.split(/\r\n|\r|\n/);

/** 中間部分の差分(LCS)。`before`/`after`は全体での行番号の起点 */
const diffMiddle = (
  a: readonly string[],
  b: readonly string[],
  offsetA: number,
  offsetB: number
): DiffLine[] => {
  if (a.length * b.length > MAX_DIFF_CELLS) {
    return [
      ...a.map((text, i): DiffLine => ({ type: 'removed', text, before: offsetA + i + 1 })),
      ...b.map((text, j): DiffLine => ({ type: 'added', text, after: offsetB + j + 1 })),
    ];
  }
  const width = b.length + 1;
  // lengths[i * width + j] = a[i..] と b[j..] のLCSの長さ
  const lengths = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i * width + j] =
        a[i] === b[j]
          ? (lengths[(i + 1) * width + j + 1] ?? 0) + 1
          : Math.max(lengths[(i + 1) * width + j] ?? 0, lengths[i * width + j + 1] ?? 0);
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({
        type: 'same',
        text: a[i] as string,
        before: offsetA + i + 1,
        after: offsetB + j + 1,
      });
      i++;
      j++;
    } else if (
      i < a.length &&
      (j >= b.length || (lengths[(i + 1) * width + j] ?? 0) >= (lengths[i * width + j + 1] ?? 0))
    ) {
      // 同じ長さなら削除を先に出す(読みやすい「- 旧 / + 新」の順にする)
      result.push({ type: 'removed', text: a[i] as string, before: offsetA + i + 1 });
      i++;
    } else {
      result.push({ type: 'added', text: b[j] as string, after: offsetB + j + 1 });
      j++;
    }
  }
  return result;
};

export const diffLines = (before: string, after: string): DiffLine[] => {
  const a = splitLines(before);
  const b = splitLines(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  ) {
    end++;
  }
  const same = (from: number, to: number, shiftB: number): DiffLine[] =>
    a.slice(from, to).map(
      (text, k): DiffLine => ({
        type: 'same',
        text,
        before: from + k + 1,
        after: from + k + 1 + shiftB,
      })
    );
  return [
    ...same(0, start, 0),
    ...diffMiddle(a.slice(start, a.length - end), b.slice(start, b.length - end), start, start),
    ...same(a.length - end, a.length, b.length - a.length),
  ];
};

/** 変わった行の数 */
export const countChanges = (lines: readonly DiffLine[]): { added: number; removed: number } => ({
  added: lines.filter(({ type }) => type === 'added').length,
  removed: lines.filter(({ type }) => type === 'removed').length,
});
