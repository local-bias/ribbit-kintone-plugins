import { css } from '@emotion/css';
import { sanitizeTooltipHtml } from '@/lib/tooltip-html';

type Props = {
  html: string;
  className?: string;
};

const contentClassName = css`
  /*
   * kintone 標準スタイルの影響を遮断するため、ツールチップ内のすべての要素を
   * ブラウザのユーザーエージェントデフォルトに戻したうえで、必要な書式を再適用する。
   */
  max-width: min(360px, calc(100vw - 48px));
  overflow-wrap: anywhere;
  line-height: 1.6;
  color: inherit;
  font: inherit;
  letter-spacing: normal;
  text-align: left;
  text-transform: none;

  & *,
  & *::before,
  & *::after {
    all: revert;
    box-sizing: border-box;
    font-family: inherit;
    color: inherit;
    max-width: 100%;
  }

  & p,
  & ul,
  & ol,
  & blockquote,
  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6,
  & pre {
    margin: 0;
  }

  & p + p,
  & p + ul,
  & p + ol,
  & p + blockquote,
  & p + pre,
  & ul + p,
  & ol + p,
  & blockquote + p,
  & pre + p,
  & h1 + p,
  & h2 + p,
  & h3 + p,
  & h4 + p,
  & h5 + p,
  & h6 + p {
    margin-top: 8px;
  }

  & ul,
  & ol {
    padding-left: 20px;
  }

  & ul {
    list-style: disc outside;
  }

  & ol {
    list-style: decimal outside;
  }

  & li {
    display: list-item;
  }

  & blockquote {
    padding-left: 12px;
    border-left: 3px solid currentColor;
    opacity: 0.85;
  }

  & strong,
  & b {
    font-weight: 700;
  }

  & em,
  & i {
    font-style: italic;
  }

  & u {
    text-decoration: underline;
  }

  & s,
  & strike,
  & del {
    text-decoration: line-through;
  }

  & code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    padding: 0.1em 0.3em;
    border-radius: 4px;
    background-color: rgb(0 0 0 / 15%);
  }

  & pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: rgb(0 0 0 / 20%);
    white-space: pre-wrap;
    word-break: break-word;
  }

  & pre code {
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  & a {
    color: inherit;
    text-decoration: underline;
  }

  & img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  & hr {
    border: 0;
    border-top: 1px solid currentColor;
    opacity: 0.3;
    margin: 8px 0;
  }

  & table {
    border-collapse: collapse;
  }

  & th,
  & td {
    border: 1px solid currentColor;
    padding: 4px 8px;
  }
`;

export function TooltipHtmlContent(props: Props) {
  return (
    <div
      className={props.className ? `${contentClassName} ${props.className}` : contentClassName}
      dangerouslySetInnerHTML={{ __html: sanitizeTooltipHtml(props.html) }}
    />
  );
}
