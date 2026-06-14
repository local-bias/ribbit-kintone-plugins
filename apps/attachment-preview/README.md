# 📎 添付ファイルプレビュープラグイン

ファイルフィールドにアップロードされた添付ファイルを、ダウンロードすることなくブラウザ上でプレビューできる kintone プラグインです。`pdf-preview` / `zip-preview` プラグインを発展させ、**可能な限り多くのファイル形式**に対応しています。

[ホームページ](https://ribbit.konomi.app)

## ✨ 特徴

- レコード一覧・詳細・編集画面の添付ファイルに「プレビュー」ボタンを追加
- 右側ドロワーで、形式に応じた最適な方法でプレビュー表示
- 設定不要（インストールするだけで動作）

### 対応フォーマット

| 種別 | 拡張子の例 | 表示方法 |
| --- | --- | --- |
| 画像 | png, jpg, gif, webp, avif, svg, bmp, ico | `<img>` |
| PDF | pdf | `<iframe>` |
| 動画 | mp4, webm, mov, m4v, ogv | `<video>` |
| 音声 | mp3, wav, ogg, m4a, aac, flac | `<audio>` |
| 表計算 | xlsx, xls, xlsm, csv, tsv, ods | SheetJS でHTMLテーブル化 |
| 文書 | docx | docx-preview でレンダリング |
| Markdown | md, markdown | marked + DOMPurify でHTML描画 |
| HTML | html, htm | サニタイズしてサンドボックス `<iframe>` |
| テキスト/ソース | txt, json, xml, yaml, js, ts, py, ... | 整形表示 |
| アーカイブ | zip | 中身を一覧表示 |
| その他 | - | ダウンロード案内を表示 |

> 上記以外の形式も、MIMEタイプから推測して可能な範囲でプレビューします。

## 🔌 外部連携

他のスクリプトからプレビューを開くこともできます。

```js
// グローバルAPI
window.ribbitKintoneAttachmentPreview.open({
  key: fileKey,        // 必須: ファイルキー
  name: fileName,      // 必須: ファイル名（拡張子で種別判定）
  contentType: mime,   // 任意: MIMEタイプ
});

// カスタムイベント
window.dispatchEvent(
  new CustomEvent('ribbit-kintone-plugin-attachment-preview:open', {
    detail: { fileKey, fileName, contentType },
  })
);
```

## 🔧 使い方

### パッケージのインストール

```
pnpm install
```

### プラグインの秘密キーと SSL 証明書の作成

```
pnpm run init
```

### ご利用の kintone へアップロード + ファイルの変更を監視

```
pnpm run dev
```

### リリース用 zip ファイルの生成

```
pnpm run build
```
