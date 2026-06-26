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
  getLoginUser: () => ({ code: 'taro', name: '田中 太郎' }),
});
