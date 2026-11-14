import { describe, expect, test } from 'vitest';
import { MAX_SAMPLE_STRING, pickRecordValues, toSampleQuery } from './record-sample';

describe('pickRecordValues', () => {
  test('指定したフィールドの値だけを返し、無いフィールドは知らせる', () => {
    const records = [
      {
        金額: { value: '100' },
        顧客: { value: '株式会社A' },
        担当: { value: [{ code: 'sato', name: '佐藤' }] },
      },
    ];
    expect(pickRecordValues(records, ['金額', '担当', '存在しない'])).toEqual({
      records: [{ 金額: '100', 担当: [{ code: 'sato', name: '佐藤' }] }],
      missingFields: ['存在しない'],
      truncated: false,
    });
  });

  test('長い文字列を切り詰め、全体の大きさで後ろのレコードを省く', () => {
    const long = 'あ'.repeat(1000);
    const result = pickRecordValues([{ 本文: { value: long } }], ['本文']);
    expect(String(result.records[0]?.本文).length).toBe(MAX_SAMPLE_STRING + 1);

    const many = Array.from({ length: 100 }, () => ({ 本文: { value: long } }));
    const limited = pickRecordValues(many, ['本文']);
    expect(limited.truncated).toBe(true);
    expect(limited.records.length).toBeLessThan(100);
  });
});

describe('pickRecordValues の件数と組み込みプロパティ', () => {
  test('指定した件数より多くは返さず、Objectの組み込みプロパティを値として拾わない', () => {
    const records = [{ a: { value: '1' } }, { a: { value: '2' } }, { a: { value: '3' } }];
    expect(pickRecordValues(records, ['a', 'constructor'], 2)).toEqual({
      records: [{ a: '1' }, { a: '2' }],
      missingFields: ['constructor'],
      truncated: false,
    });
  });
});

describe('toSampleQuery', () => {
  test('ページ送りの指定を除き、絞り込みと並び順は残す', () => {
    expect(toSampleQuery('金額 > 0 order by 金額 desc limit 20 offset 40', 3)).toBe(
      '金額 > 0 order by 金額 desc limit 3'
    );
    expect(toSampleQuery('order by $id desc limit 20 offset 0', 5)).toBe(
      'order by $id desc limit 5'
    );
    expect(toSampleQuery('', 3)).toBe('limit 3');
  });
});
