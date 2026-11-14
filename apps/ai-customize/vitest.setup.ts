import { vi } from 'vitest';

// `@konomi-app/kintone-utilities` 系のモジュールは読み込み時にグローバルの `kintone`
// オブジェクトへアクセスするため、テスト環境向けに最小限のスタブを用意する
// (本プラグインの判定ロジックはグローバルに依存させず、引数で受け取る設計にしている)
vi.stubGlobal('kintone', {
  $PLUGIN_ID: 'test-plugin-id',
  app: {
    getId: () => 1,
  },
  plugin: {
    app: {
      getConfig: () => ({}),
    },
  },
  getLoginUser: () => ({ code: 'taro', name: '田中 太郎', language: 'ja' }),
});

// `detectGuestSpaceId`(`src/lib/global.ts`)などがURLを読むため、通常スペースのアプリ画面にしておく
vi.stubGlobal('location', {
  origin: 'https://example.cybozu.com',
  href: 'https://example.cybozu.com/k/1/',
  pathname: '/k/1/',
  search: '',
});
