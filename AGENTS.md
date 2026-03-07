# AGENTS.md

## kintone

### グローバル変数

kintone特有のグローバル変数として`kintone`があるが、基本的にはこれを使用せず、`@/lib/global.ts`で定義されている定数もしくは`@konomi-app/kintone-utilities`のユーティリティ関数を使用する。

### APIリクエスト

プラグインはすべてクライアントサイドで動作するため、APIリクエストはすべてブラウザから行われる。
しかし、多くのAPIではcorsポリシーによりブラウザから直接エンドポイントにアクセスできないため、以下の方法でAPIリクエストを行う必要がある。

- kintone REST APIを呼び出す際は、`@konomi-app/kintone-utilities`の[`getAllRecords`や`updateRecords`などのユーティリティ関数](./docs/utilities-rest-api.md)を使用する。
- kintone以外のAPIを呼び出す際は、[`@konomi-app/ketch`](./docs/ketch.md)を使用する。

### フィールド形式

保存したレコード情報は以下のような形式で取得される。

```json
{
  "records": [
    {
      "フィールドコード1": {
        "type": "フィールドタイプ",
        "value": "フィールドの値"
      },
      "フィールドコード2": {
        "type": "フィールドタイプ",
        "value": "フィールドの値"
      }
    }
  ]
}
```

フィールドタイプによって`value`の値の形式が異なるため、フィールドタイプに応じた処理が必要。
各フィールドタイプの`value`の形式は[公式ドキュメント](https://cybozu.dev/ja/kintone/docs/overview/field-types/)を参照。

取得した値を保持する必要がなく、画面上に表示するだけの場合は、`@konomi-app/kintone-utilities`の`getFieldValueAsString`を使用することで、フィールドタイプに関係なく値を文字列として取得できる。

また、`DROPDOWN`, `RADIO_BUTTON`, `CHECK_BOX`などの選択肢フィールドの場合、[アプリのフィールドを取得するAPI](https://cybozu.dev/ja/kintone/docs/rest-api/apps/form/get-form-fields/)で選択肢の値と表示名の対応を取得し、表示名を取得する必要がある。APIは[`@konomi-app/kintone-utilities`の`getFormFields`](./docs/utilities-rest-api.md)を使用して呼び出すことができる。

### kintoneプラグイン

kintoneにはChromeの拡張機能のように、kintoneの機能を拡張するための「kintoneプラグイン」という仕組みが存在する。
kintoneプラグインは、kintoneの特定のページにおいて、`script`タグを通じて読み込まれる。読み込まれるページは大きく2種類あり、1つはプラグイン独自の設定を行うための「設定画面」、もう1つはkintoneの標準機能を拡張するための「操作画面」がある。
プロジェクトでは`apps/{app-name}/config`以下に設定画面のコードを、`apps/{app-name}/desktop`以下に操作画面のコードを配置する。

#### ストレージ

kintoneにはアプリ毎にプラグイン単位にデータを保存できるストレージが存在する。このストレージは設定画面と操作画面の両方からアクセスでき、操作画面からは読み取り専用でアクセスできる。
このストレージを使用し、設定画面で行った設定を操作画面に反映させることができる。ストレージへのアクセスは、`@konomi-app/kintone-utilities`の`storePluginConfig`と`restorePluginConfig`を使用して行うことができる。

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
