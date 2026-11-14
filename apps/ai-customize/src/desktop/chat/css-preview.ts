/**
 * CSSのプレビュー(保存せずに、いま開いている画面へ一時的に当てる)
 *
 * 専用の`<style data-ai-customize-preview>`を1つだけ持ち、当て直すときは中身を置き換える。
 * 解除はAIのツールにせず、利用者が常に押せる「プレビューを解除」で同期的に行う。
 * パネルを閉じたとき・画面を移ったときにも外す(呼び出し側)
 *
 * AIの`preview_css`と承認カードの「プレビュー」で同じものを使う(同時に当たるのは1つだけ)
 *
 * @see docs/07-ai-tools.md 4-9章、docs/06-ui.md 6章「プレビュー」
 */

export type CssPreviewSource = 'ai' | 'approval';

export type CssPreviewState = { source: CssPreviewSource; code: string } | null;

const ATTRIBUTE = 'data-ai-customize-preview';

let current: CssPreviewState = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const findStyle = (): HTMLStyleElement | null =>
  document.head.querySelector<HTMLStyleElement>(`style[${ATTRIBUTE}]`);

/** 画面を移ったら外す。画面の部品が描画されているかに関係なく効くよう、当てている間だけここで購読する */
const NAVIGATION_EVENTS = ['hashchange', 'popstate'] as const;
const clearOnNavigation = () => cssPreview.clear();

export const cssPreview = {
  get: (): CssPreviewState => current,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  show: (source: CssPreviewSource, code: string): void => {
    let style = findStyle();
    if (style === null) {
      style = document.createElement('style');
      style.setAttribute(ATTRIBUTE, '');
      // 後から読み込まれたkintoneや他のカスタマイズのCSSより優先されるよう、末尾に置く
      document.head.append(style);
    }
    // 文字列として入れる(HTMLとして解釈しない)
    style.textContent = code;
    if (current === null) {
      for (const type of NAVIGATION_EVENTS) window.addEventListener(type, clearOnNavigation);
    }
    current = { source, code };
    notify();
  },
  clear: (): void => {
    // `<style>`は`show`でだけ作る。当てていなければDOMに触らない
    if (current === null) return;
    findStyle()?.remove();
    for (const type of NAVIGATION_EVENTS) window.removeEventListener(type, clearOnNavigation);
    current = null;
    notify();
  },
};
