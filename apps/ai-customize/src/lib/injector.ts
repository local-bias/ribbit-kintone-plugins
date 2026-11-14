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
  remove: () => void;
};

export type DocumentLike = {
  createElement: (tagName: 'style') => StyleLike;
  /** 既にある要素を渡すと末尾へ移す(DOMの`appendChild`と同じ) */
  head: { appendChild: (node: StyleLike) => unknown };
};

export type Injector = {
  /**
   * 指定したアセットのCSSを、指定した画面向けに適用します
   *
   * - 一覧に無いアセットの`<style>`は取り除く(パネルで無効にしたとき)
   * - 適用画面外のものも無効の状態で作る。画面ごとに初めて対象になった時点で末尾へ足すと、
   *   画面の行き来で`head`内の順序が実行順とずれ、詳細度が同じ規則の勝ち負けが変わるため
   * - 実行順と`head`内の順序が変わったときだけ並べ直す(毎回動かすと、そのたびにスタイルの再計算が走る)
   */
  sync: (assets: readonly Asset[], screen: AssetScreen) => void;
};

export const createInjector = (document: DocumentLike): Injector => {
  const styles = new Map<string, StyleLike>();
  /** `head`へ入れた順序 */
  let placed: string[] = [];

  const ensureStyle = (asset: Asset): StyleLike => {
    const existing = styles.get(asset.id);
    if (existing) {
      if (existing.textContent !== asset.code) existing.textContent = asset.code;
      return existing;
    }
    const style = document.createElement('style');
    style.setAttribute('data-ai-customize-id', asset.id);
    style.setAttribute('data-ai-customize-scope', asset.scope);
    style.textContent = asset.code;
    document.head.appendChild(style);
    styles.set(asset.id, style);
    placed = [...placed, asset.id];
    return style;
  };

  const removeExcept = (ids: ReadonlySet<string>) => {
    for (const [id, style] of styles) {
      if (!ids.has(id)) {
        style.remove();
        styles.delete(id);
      }
    }
    placed = placed.filter((id) => ids.has(id));
  };

  const sync: Injector['sync'] = (assets, screen) => {
    const cssAssets = assets.filter((asset) => asset.kind === 'css');
    const ids = cssAssets.map((asset) => asset.id);
    removeExcept(new Set(ids));
    for (const asset of cssAssets) {
      ensureStyle(asset).disabled = !isScreenTarget(asset, screen);
    }
    if (placed.join('\n') !== ids.join('\n')) {
      for (const id of ids) {
        const style = styles.get(id);
        if (style) document.head.appendChild(style);
      }
      placed = ids;
    }
  };

  return { sync };
};
