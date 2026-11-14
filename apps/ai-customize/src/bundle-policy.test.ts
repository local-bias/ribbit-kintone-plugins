import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

/**
 * 配布の方針: `desktop.js` / `config.js` の1ファイルずつで配布する(ADR-47)
 *
 * 動的importは別ファイルに分かれ、zipに入れる形(standalone)では読み込めない。
 * 評価を遅らせたいときは`webpackMode: "eager"`を付けて同じファイルに含める
 */

const listSources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });

describe('配布の方針', () => {
  test('動的importは全て同じファイルに含める指定をしている', () => {
    const offenders = listSources(join(__dirname)).flatMap((path) =>
      [
        ...readFileSync(path, 'utf8').matchAll(
          /\bimport\(\s*(?!\/\*\s*webpackMode:\s*"eager"\s*\*\/)['"`]/g
        ),
      ].map(() => path)
    );
    expect(offenders).toEqual([]);
  });
});
