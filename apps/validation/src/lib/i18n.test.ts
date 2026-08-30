import { describe, expect, test } from 'vitest';
import { t, ui } from './i18n';

const languages = Object.keys(ui) as (keyof typeof ui)[];

/**
 * このプラグイン固有の翻訳のみを取り出します。
 * `common.` で始まるキーは共通パッケージ（`@repo/utils`）が提供するため、
 * 言語ごとの過不足はこのプラグインの管理対象外とします。
 */
const ownEntries = (language: keyof typeof ui): [string, string][] =>
  Object.entries(ui[language] as Record<string, string>).filter(
    ([key]) => !key.startsWith('common.')
  );

/** 文言に含まれる置換プレースホルダー（`{0}`など）の番号一覧 */
const placeholders = (value: string): string[] =>
  [...value.matchAll(/\{(\d)\}/g)].map((matched) => matched[1] as string).sort();

const baseKeys = ownEntries('ja')
  .map(([key]) => key)
  .sort();

describe('ui - 翻訳辞書', () => {
  test.each(languages)('%s はプラグイン固有の翻訳キーをすべて持つ', (language) => {
    expect(
      ownEntries(language)
        .map(([key]) => key)
        .sort()
    ).toEqual(baseKeys);
  });

  test.each(languages)('%s の各文言は空でない', (language) => {
    const empty = ownEntries(language)
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  test.each(languages)('%s の置換プレースホルダーは日本語と一致する', (language) => {
    const japanese = Object.fromEntries(
      ownEntries('ja').map(([key, value]) => [key, placeholders(value)])
    );
    const target = Object.fromEntries(
      ownEntries(language).map(([key, value]) => [key, placeholders(value)])
    );
    expect(target).toEqual(japanese);
  });
});

describe('t - 翻訳関数', () => {
  test('ログインユーザーの言語（テストでは日本語）の文言を返す', () => {
    expect(t('desktop.error.recordHeading')).toBe(
      '以下の入力内容にエラーがあるため保存できません。'
    );
  });

  test('プレースホルダーを引数で置換する', () => {
    expect(t('csv.result.error.row', '3', 'エラー')).toBe('行 3: エラー');
  });
});
