import { styled } from '@mui/material/styles';

const Pre = styled('pre')(({ theme }) => ({
  margin: 0,
  padding: '8px 0',
  maxHeight: 360,
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  background: theme.palette.action.hover,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.6,
  tabSize: 2,
  counterReset: 'line',
}));

const Line = styled('span')(({ theme }) => ({
  display: 'block',
  paddingRight: 12,
  whiteSpace: 'pre',
  '&::before': {
    counterIncrement: 'line',
    content: 'counter(line)',
    display: 'inline-block',
    width: '3.5em',
    marginRight: 12,
    paddingRight: 8,
    borderRight: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.disabled,
    textAlign: 'right',
    userSelect: 'none',
  },
}));

/**
 * 行番号つきのコード表示(読み取り専用)
 *
 * 構文ハイライトはv1では入れない(バンドルサイズ優先。docs/06-ui.md 5章)。
 * コードは文字列として描画し、HTMLとして解釈しない
 */
export function CodeView(props: { code: string; label: string }) {
  return (
    <Pre aria-label={props.label} tabIndex={0}>
      <code>
        {props.code.split(/\r\n|\r|\n/).map((line, index) => (
          // 行は並び替わらず、同じ位置の行は同じ行として扱ってよい
          // biome-ignore lint/suspicious/noArrayIndexKey: 行番号そのものが識別子
          <Line key={index}>{line}</Line>
        ))}
      </code>
    </Pre>
  );
}
