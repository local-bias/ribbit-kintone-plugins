import { describe, expect, test } from 'vitest';
import { canReorderAll, moveItem, planOrderUpdates } from './asset-order';

describe('moveItem', () => {
  test('要素を移動した新しい配列を返す', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(items, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
  });

  test('範囲外の指定では並びを変えない', () => {
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
  });
});

describe('planOrderUpdates', () => {
  test('先頭から100刻みで振り直し、値が変わったレコードだけを返す', () => {
    expect(
      planOrderUpdates([
        { id: '3', revision: '5', order: 300 },
        { id: '1', revision: '2', order: 200 },
        { id: '2', revision: '9', order: 100 },
      ])
    ).toEqual([
      { id: '3', revision: '5', order: 100 },
      { id: '2', revision: '9', order: 300 },
    ]);
  });

  test('既定値(全て100)のままのレコードも、並び順どおりに振り直す', () => {
    expect(
      planOrderUpdates([
        { id: '1', revision: '1', order: 100 },
        { id: '2', revision: '1', order: 100 },
      ])
    ).toEqual([{ id: '2', revision: '1', order: 200 }]);
  });
});

describe('canReorderAll', () => {
  test('全てのレコードの実行順を編集できるときだけ並べ替えられる', () => {
    expect(canReorderAll([{ canReorder: true }, { canReorder: true }])).toBe(true);
    expect(canReorderAll([{ canReorder: true }, { canReorder: false }])).toBe(false);
  });

  test('1件以下なら並べ替えるものがない', () => {
    expect(canReorderAll([{ canReorder: true }])).toBe(false);
  });
});
