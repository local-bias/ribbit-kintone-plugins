import type { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PLUGIN_ROOT_ID } from '@/lib/constants';

let root: Root | null = null;
let container: HTMLElement | null = null;

/**
 * タブUIを、レコード画面の先頭へ描画します
 *
 * `@konomi-app/kintone-utilities-react`の`ComponentManager`と同じ役割ですが、
 * 同パッケージは1つのモジュールへ全てのUI部品(MUI・Radix・Tiptapなど)を同梱しており、
 * 1つでもimportすると操作画面のバンドルへ全て取り込まれてしまいます(実測で約760KB増加)。
 * 操作画面で必要なのは描画先の管理だけのため、最小限の実装をここに置いています。
 *
 * 同じ画面でイベントが複数回発生しても要素とルートを作り直さないよう、
 * 生成済みのものを再利用します。
 */
export const mountTabList = (component: ReactNode, parentElement: Element) => {
  if (!container) {
    container = document.createElement('div');
    // タブUIのCSSはこのidを起点に詳細度を確保しているため、必ず付与する
    // (`🐸`はプラグイン共通のスタイルスコープ)
    container.id = PLUGIN_ROOT_ID;
    container.classList.add('🐸');
  }
  if (container.parentElement !== parentElement) {
    parentElement.prepend(container);
  }
  root ??= createRoot(container);
  root.render(component);
};
