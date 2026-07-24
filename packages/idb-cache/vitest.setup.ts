// テスト環境にはkintoneランタイムが存在しないため、
// `@konomi-app/kintone-utilities`がimport時に`kintone.app.getId()`でモバイル判定を行う際に
// クラッシュしないよう、最低限のグローバルを用意する。
globalThis.location = { pathname: '/k/1/' } as Location;

globalThis.kintone = {
  ...globalThis.kintone,
  app: globalThis.kintone?.app ?? { getId: () => '1' },
} as typeof kintone;
