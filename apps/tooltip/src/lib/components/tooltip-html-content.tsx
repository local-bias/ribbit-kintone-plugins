import { sanitizeTooltipHtml } from '@/lib/tooltip-html';
import { css } from '@emotion/css';

type Props = {
  html: string;
  className?: string;
};

const contentClassName = css`
  max-width: min(360px, calc(100vw - 48px));
  overflow-wrap: anywhere;
  line-height: 1.6;

  p,
  ul,
  ol,
  blockquote,
  h2,
  h3 {
    margin: 0;
  }

  p + p,
  p + ul,
  p + ol,
  p + blockquote,
  ul + p,
  ol + p,
  blockquote + p,
  h2 + p,
  h3 + p {
    margin-top: 8px;
  }

  ul,
  ol {
    padding-left: 20px;
  }

  blockquote {
    padding-left: 12px;
    border-left: 3px solid currentColor;
    opacity: 0.85;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }

  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 8px;
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
