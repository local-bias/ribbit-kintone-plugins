import { describe, expect, test } from 'vitest';
import { assetTitle, formatLines, permissionChips } from './asset-labels';

describe('permissionChips', () => {
  test('付与済みの書き込み系権限を並べ、外部(すべて)と制限なしは注意にする', () => {
    expect(
      permissionChips({
        permissions: ['put', 'external-listed', 'external-all', 'unrestricted'],
        externalUrls: ['https://a.example/', 'https://b.example/'],
      })
    ).toEqual([
      { label: '更新', caution: false },
      { label: '外部: 2件', caution: false },
      { label: '外部: すべて', caution: true },
      { label: '制限なし', caution: true },
    ]);
  });

  test('読み取りのみなら何も出さない', () => {
    expect(permissionChips({ permissions: [], externalUrls: [] })).toEqual([]);
  });
});

describe('assetTitle', () => {
  test('空のタイトルは(無題)', () => {
    expect(assetTitle({ title: '  ' })).toBe('(無題)');
    expect(assetTitle({ title: '合計' })).toBe('合計');
  });
});

describe('formatLines', () => {
  test('重複を除いて昇順に並べ、多ければ省略する', () => {
    expect(formatLines([40, 12, 12])).toBe('12行目、40行目');
    expect(formatLines([1, 2, 3, 4, 5, 6])).toBe('1行目、2行目、3行目、4行目、5行目…');
    expect(formatLines([])).toBe('');
  });
});
