import '@/lib/global';
import './event';

// デバッグUIは開発時のみ読み込む(本番バンドルから除外)。
// `process.env.NODE_ENV`はビルド時にリテラル置換されるため、本番ではこの分岐ごと削除され、
// `./debug`とその依存(@uiw/react-json-viewなど)はバンドルされない。
// 動的importではなく`require`なのは、開発時に別チャンクへ分離されるのを防ぐため
// (kintone上ではpublicPathが`/`となり、非同期チャンクを取得できない)。
declare const process: { env: { NODE_ENV?: string } };
declare const require: (path: string) => void;

if (process.env.NODE_ENV !== 'production') {
  require('./debug');
}
