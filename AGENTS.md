## ketch (`@konomi-app/ketch`)

多くのAPIではcorsポリシーによりブラウザから直接kintoneにアクセスできないため、サーバーサイドでAPIリクエストをプロキシする`@konomi-app/ketch`を使用する。これにより、APIキーやドメインなどの機密情報をクライアントに公開せずに済む。
`fetch`と同様のインターフェースで使用でき、レスポンスは`Response`オブジェクトとして返される。
`kintone.proxy`や`kintone.plugin.app.proxy`の使用は避け、すべてのAPIリクエストは`@konomi-app/ketch`を通じて行うことを推奨。
**kintone REST APIを呼び出す際は、`@konomi-app/ketch`ではなく`@konomi-app/kintone-utilities`の`getAllRecords`や`updateRecords`などのユーティリティ関数を使用することが望ましい**。

```typescript
import { createKetch } from '@konomi-app/ketch';

const ketch = createKetch({ pluginId: 'target-plugin-id' });

const response = await ketch('https://example.com/api/sample', {
  method: 'POST',
  body: JSON.stringify({
    app: 123,
    records: [
      {
        fieldCode: { value: 'example' },
      },
    ],
  }),
});
```

## グローバル変数

kintone特有のグローバル変数として`kintone`があるが、基本的にはこれを使用せず、`@/lib/global.ts`で定義されている定数もしくは`@konomi-app/kintone-utilities`のユーティリティ関数を使用する。

## kintone REST API

kintone REST APIを呼び出す際は、`@konomi-app/kintone-utilities`の`getAllRecords`や`updateRecords`などのユーティリティ関数を使用することが望ましい。
通常のアプリとゲストスペースのアプリでAPIエンドポイントが異なる。
参照先のアプリが現在プラグインが実行されているアプリの場合、`guestSpaceId`は`GUEST_SPACE_ID`を使用する。

## Reactの状態管理

状態管理には`jotai`を使用する。
各コンポーネントの引数は最小限とし、コンポーネント内で`jotai`から必要な状態を取得するようにすることで、コンポーネントの再利用性を高め、レンダリングコストを最適化する。
