import { describe, expect, test } from 'vitest';
import { classifyEmptyRows, type RowMeasurement } from './empty-rows';

type Row = { name: string } & RowMeasurement;

const classify = (rows: Row[]) => {
  const { collapsing, deferred } = classifyEmptyRows(rows, (row) => row);
  return {
    collapsing: collapsing.map((row) => row.name),
    deferred: deferred.map((row) => row.name),
  };
};

describe('classifyEmptyRows', () => {
  test('表示できる要素が無い行を畳む対象とする', () => {
    expect(classify([{ name: 'empty', isRendered: true, hasVisibleElement: false }])).toStrictEqual(
      {
        collapsing: ['empty'],
        deferred: [],
      }
    );
  });

  test('表示できる要素が残っている行は畳まない', () => {
    expect(classify([{ name: 'filled', isRendered: true, hasVisibleElement: true }])).toStrictEqual(
      { collapsing: [], deferred: [] }
    );
  });

  test('描画されていない行は、閉じたグループの内側にあるため畳まず保留する', () => {
    expect(
      classify([{ name: 'inClosedGroup', isRendered: false, hasVisibleElement: false }])
    ).toStrictEqual({ collapsing: [], deferred: ['inClosedGroup'] });
  });

  test('複数の行をそれぞれの状態に応じて振り分ける', () => {
    expect(
      classify([
        { name: 'filled', isRendered: true, hasVisibleElement: true },
        { name: 'empty', isRendered: true, hasVisibleElement: false },
        { name: 'inClosedGroup', isRendered: false, hasVisibleElement: false },
      ])
    ).toStrictEqual({ collapsing: ['empty'], deferred: ['inClosedGroup'] });
  });

  test('行が無い場合は空の結果を返す', () => {
    expect(classify([])).toStrictEqual({ collapsing: [], deferred: [] });
  });

  test('全ての行を計測してから振り分ける', () => {
    const measured: string[] = [];
    const rows: Row[] = [
      { name: 'a', isRendered: true, hasVisibleElement: false },
      { name: 'b', isRendered: true, hasVisibleElement: false },
    ];

    const { collapsing } = classifyEmptyRows(rows, (row) => {
      measured.push(row.name);
      return row;
    });

    expect(measured).toStrictEqual(['a', 'b']);
    expect(collapsing.map((row) => row.name)).toStrictEqual(['a', 'b']);
  });
});
