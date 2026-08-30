import { vi } from 'vitest';

// `@konomi-app/kintone-utilities` 系のモジュールは読み込み時にグローバルの `kintone`
// オブジェクトへアクセスするため、テスト環境向けに最小限のスタブを用意する
vi.stubGlobal('kintone', {
  app: {
    getId: () => 1,
    getLookupTargetAppId: () => null,
  },
  mobile: {
    app: {
      getId: () => null,
    },
  },
  getLoginUser: () => ({ code: 'taro', name: '田中 太郎', language: 'ja' }),
});

// `detectGuestSpaceId`（`@/lib/global` 経由で `@/lib/i18n` から読み込まれる）が
// `location.pathname` を参照するため、ゲストスペース以外のパスをスタブする
vi.stubGlobal('location', { pathname: '/k/1/' });
