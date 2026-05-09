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