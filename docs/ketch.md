# ketch (`@konomi-app/ketch`)

kintoneでは、クライアント(ブラウザ)から外部のAPIを実行できるようにするために、`kintone.proxy`や`kintone.plugin.app.proxy`といった関数が提供されている。

これらの関数を実行すると、一度kintoneのサーバーにリクエスト情報が送信され、追加のパラメータが付与された上で指定したエンドポイントにリクエストが送信される。
これにより、corsエラーを避け、APIキーやドメインなどの機密情報をクライアントに公開せずに外部APIを呼び出すことができる。

`@konomi-app/ketch`は、`kintone.proxy`や`kintone.plugin.app.proxy`のラッパーライブラリであり、APIリクエストをプロキシするためのインターフェースを提供する。

`@konomi-app/ketch`を使用することで、kintoneの独自インターフェースを意識せず、`fetch`と同様のインターフェースでAPIリクエストをプロキシすることができる。

## サンプルコード

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

const data = await response.json();
console.log(data);
```

## 注意点

`@konomi-app/ketch`は**kintone以外のAPIを呼び出すためのライブラリ**であるため、**kintone REST APIに`@konomi-app/ketch`を使用することは禁止**です。

代わりに`@konomi-app/kintone-utilities`の`getAllRecords`や`updateRecords`などのユーティリティ関数を使用してください。
