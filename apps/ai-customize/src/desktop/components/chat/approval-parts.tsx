import { Alert, Button, TextField } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { type MouseEvent, type ReactNode, useState } from 'react';
import { t } from '@/lib/i18n';
import type { DiffLine } from '@/lib/line-diff';
import type { AssetScope } from '@/schema/asset';
import { isTrustedEvent } from '../use-edit-action';

/**
 * 書き込みの承認カードで共通に使う部品
 *
 * @see docs/06-ui.md 6章、docs/07-ai-tools.md 5章
 */

/** 承認カードの枠。承認待ちであることを色だけに頼らず、見出しで示す */
export const ApprovalFrame = styled('section')(({ theme }) => ({
  display: 'grid',
  gap: 8,
  padding: 12,
  border: `1px solid ${theme.palette.warning.main}`,
  borderRadius: 8,
  background: alpha(theme.palette.warning.main, 0.06),
  fontSize: 13,
  overflowWrap: 'anywhere',
  '& h3': { margin: 0, fontSize: 14 },
  '& fieldset': { margin: 0, padding: 0, border: 'none', display: 'grid', gap: 2 },
  '& legend': { padding: 0, marginBottom: 2, fontWeight: 600 },
}));

export const scopeLabel = (scope: AssetScope): string =>
  t(scope === 'public' ? 'desktop.row.scope.public' : 'desktop.row.scope.private');

/** 保存できない理由(承認しても保存されず、理由がAIへ返る) */
export function Blockers(props: { items: readonly string[] }) {
  if (props.items.length === 0) return null;
  return (
    <Alert severity='error'>
      <strong>{t('desktop.chat.write.blockers')}</strong>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Alert>
  );
}

/** 保存はするが、利用者に確かめてほしいこと(危険なパターン・不要な権限など) */
export function Warnings(props: { items: readonly string[] }) {
  if (props.items.length === 0) return null;
  return (
    <Alert severity='warning'>
      <strong>{t('desktop.chat.write.warnings')}</strong>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Alert>
  );
}

const DiffPre = styled('pre')(({ theme }) => ({
  margin: 0,
  maxHeight: 360,
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: 12,
  lineHeight: 1.6,
  tabSize: 2,
  '& > span': { display: 'block', whiteSpace: 'pre', paddingRight: 12 },
  '& > span::before': {
    display: 'inline-block',
    width: '2em',
    textAlign: 'center',
    userSelect: 'none',
  },
  '& .added': { background: alpha(theme.palette.success.main, 0.15) },
  '& .added::before': { content: '"+"' },
  '& .removed': { background: alpha(theme.palette.error.main, 0.15) },
  '& .removed::before': { content: '"-"' },
  '& .same': { color: theme.palette.text.secondary },
  '& .same::before': { content: '" "' },
}));

/** 行単位の差分。追加・削除は色に加えて行頭の`+`/`-`で示す */
export function DiffView(props: { lines: readonly DiffLine[]; label: string }) {
  return (
    <DiffPre aria-label={props.label} tabIndex={0}>
      {props.lines.map((line) => (
        <span
          key={`${line.type}-${'before' in line ? line.before : ''}-${'after' in line ? line.after : ''}`}
          className={line.type}
        >
          {line.text}
        </span>
      ))}
    </DiffPre>
  );
}

/**
 * 承認・却下のボタンと却下の理由
 *
 * 承認はアセットのコードが`.click()`で押せないよう、利用者の操作(`isTrusted`)だけを受け付ける
 */
export function ApprovalActions(props: {
  approveLabel: string;
  ready: boolean;
  onApprove: () => void;
  onDeny: (reason: string) => void;
  /** 承認と却下のあいだに置く操作(プレビュー・代わりに無効にする など) */
  extra?: ReactNode;
}) {
  const [reason, setReason] = useState('');
  return (
    <>
      <TextField
        size='small'
        fullWidth
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={t('desktop.chat.write.reason')}
        slotProps={{
          htmlInput: { 'aria-label': t('desktop.chat.write.reason'), maxLength: 200 },
        }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          variant='contained'
          size='small'
          color='warning'
          disabled={!props.ready}
          onClick={(event: MouseEvent) => {
            if (isTrustedEvent(event) && props.ready) props.onApprove();
          }}
        >
          {props.approveLabel}
        </Button>
        {props.extra}
        <Button size='small' color='inherit' onClick={() => props.onDeny(reason)}>
          {t('desktop.chat.write.deny')}
        </Button>
      </div>
    </>
  );
}
