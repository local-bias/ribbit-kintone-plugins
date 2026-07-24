// テスト環境にはkintoneランタイムが存在しないため、
// `@/lib/global` (kintone.$PLUGIN_ID / kintone.getLoginUser) をimportするモジュールが
// テストのimport解決時にクラッシュしないよう、最低限のグローバルを用意する。
globalThis.location = { pathname: '/k/1/' } as Location;

globalThis.kintone = {
  ...globalThis.kintone,
  $PLUGIN_ID: globalThis.kintone?.$PLUGIN_ID ?? 'test-plugin-id',
  // `@konomi-app/kintone-utilities`がimport時に`kintone.app.getId()`でモバイル判定を行うため、
  // デスクトップ環境として扱われるよう最低限のappオブジェクトを用意する
  app: globalThis.kintone?.app ?? { getId: () => '1' },
  getLoginUser:
    globalThis.kintone?.getLoginUser ??
    (() => ({
      code: 'test-user',
      id: 'test-user-id',
      name: 'Test User',
      language: 'ja',
    })),
} as typeof kintone;

// vitestのデフォルト環境(node)にはlocalStorageが存在しないため、
// レガシーキャッシュ削除処理(cleanupLegacyLocalStorageCache)のテスト用に最低限のモックを用意する。
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}
