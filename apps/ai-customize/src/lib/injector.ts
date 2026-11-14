import type { Asset, AssetScreen } from '@/schema/asset';
import { isScreenTarget } from './asset-filter';

/**
 * CSSアセットの`<style>`を管理します
 *
 * - `document.head`の末尾に、実行順で挿入する(kintone標準スタイルより後ろに来る)
 * - 画面が切り替わるたびに、適用画面に合わせて`disabled`を切り替える
 *   (詳細⇄編集のページ内遷移で、詳細用CSSを編集画面に残さない)
 *
 * @see docs/05-runtime.md 6章
 */

export type StyleLike = {
  textContent: string | null;
  disabled: boolean;
  setAttribute: (name: string, value: string) => void;
};

export type DocumentLike = {
  createElement: (tagName: 'style') => StyleLike;
  head: { appendChild: (node: StyleLike) => unknown };
};

export type Injector = {
  /** 指定した画面向けにCSSを適用します。初回は`<style>`を作り、以降は有効/無効だけを切り替える */
  sync: (assets: readonly Asset[], screen: AssetScreen) => void;
};

export const createInjector = (document: DocumentLike): Injector => {
  const styles = new Map<string, StyleLike>();

  const ensureStyle = (asset: Asset): StyleLike => {
    const existing = styles.get(asset.id);
    if (existing) {
      return existing;
    }
    const style = document.createElement('style');
    style.setAttribute('data-ai-customize-id', asset.id);
    style.setAttribute('data-ai-customize-scope', asset.scope);
    style.textContent = asset.code;
    document.head.appendChild(style);
    styles.set(asset.id, style);
    return style;
  };

  const sync: Injector['sync'] = (assets, screen) => {
    for (const asset of assets) {
      if (asset.kind !== 'css') {
        continue;
      }
      const isTarget = isScreenTarget(asset, screen);
      if (!isTarget && !styles.has(asset.id)) {
        continue;
      }
      ensureStyle(asset).disabled = !isTarget;
    }
  };

  return { sync };
};
