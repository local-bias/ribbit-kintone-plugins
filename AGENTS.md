# AGENTS.md

## kintone

`apps/`以下の各プラグインはkintoneの特定のページにおいて、`script`タグを通じて読み込まれる。
このため、プラグインのコードはkintoneの仕様に準拠して実装する必要がある。

### グローバル変数

kintone特有のグローバル変数として`kintone`があるが、基本的にはこれを使用せず、`@/lib/global.ts`で定義されている定数もしくは`@konomi-app/kintone-utilities`のユーティリティ関数を使用する。

### ketch (`@konomi-app/ketch`)

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

### kintone REST API

kintone REST APIを呼び出す際は、`@konomi-app/kintone-utilities`の`getAllRecords`や`updateRecords`などのユーティリティ関数を使用することが望ましい。
通常のアプリとゲストスペースのアプリでAPIエンドポイントが異なる。
参照先のアプリが現在プラグインが実行されているアプリの場合、`guestSpaceId`は`GUEST_SPACE_ID`を使用する。

## React

### 状態管理

状態管理には`jotai`を使用する。
各コンポーネントの引数は最小限とし、コンポーネント内で`jotai`から必要な状態を取得するようにすることで、コンポーネントの再利用性を高め、レンダリングコストを最適化する。

### コンポーネントのスタイリング

kintone標準のスタイルとの競合を避けるため、Reactコンポーネントのスタイリングには`@emotion/styled`を使用する。
スタイルの定義はコンポーネントファイル内に記述する。

### コンポーネントのディレクトリ

Reactコンポーネントの配置は、以下の優先順位で行う。

1. 汎用的なUIコンポーネントは`packages/ui`に配置し、アプリ間で共有する。
2. プラグインの設定画面と操作画面で共通して使用されるコンポーネントは、`apps/{app-name}/src/components`に配置する。
3. 特定の画面でのみ使用されるコンポーネントは、`apps/{app-name}/src/{desktop|config}/components`に配置する。
