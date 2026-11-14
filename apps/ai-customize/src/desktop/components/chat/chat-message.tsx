import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import { splitTextBlocks } from '@/lib/ai/text-blocks';
import { t } from '@/lib/i18n';

const Bubble = styled('div')<{ from: 'user' | 'assistant' }>(({ theme, from }) => ({
  justifySelf: from === 'user' ? 'end' : 'stretch',
  maxWidth: from === 'user' ? '85%' : '100%',
  padding: from === 'user' ? '6px 10px' : 0,
  borderRadius: 10,
  background: from === 'user' ? theme.palette.action.selected : 'none',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  display: 'grid',
  gap: 8,
}));

const Code = styled('pre')(({ theme }) => ({
  margin: 0,
  padding: 8,
  maxHeight: 320,
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  background: theme.palette.action.hover,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.5,
  whiteSpace: 'pre',
  tabSize: 2,
}));

function CodeBlock(props: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <small>{props.language}</small>
        <Button size='small' onClick={() => void copy()}>
          {t(copied ? 'desktop.chat.code.copied' : 'desktop.chat.code.copy')}
        </Button>
      </div>
      <Code tabIndex={0}>
        <code>{props.code}</code>
      </Code>
    </div>
  );
}

/**
 * 利用者とAIの発言
 *
 * AIの返答はMarkdownとして解釈せず、コードブロックだけを分けてテキストとして描く(HTMLを差し込まない)
 */
export function ChatMessage(props: { from: 'user' | 'assistant'; text: string }) {
  if (props.from === 'user') {
    return <Bubble from='user'>{props.text}</Bubble>;
  }
  return (
    <Bubble from='assistant'>
      {splitTextBlocks(props.text).map((block, index) =>
        block.type === 'code' ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: 発言の中の順序は変わらない
          <CodeBlock key={index} language={block.language} code={block.code} />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: 発言の中の順序は変わらない
          <span key={index}>{block.text}</span>
        )
      )}
    </Bubble>
  );
}
