import { Alert, Button, IconButton, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import { type FormEvent, useState } from 'react';
import type { AssetUsage, UnregisteredTarget } from '@/lib/asset-usage';
import {
  appendExternalPattern,
  listExternalUrlLines,
  matchExternalTarget,
  removeExternalLine,
} from '@/lib/external-target';
import { t } from '@/lib/i18n';
import type { Asset } from '@/schema/asset';
import { formatLines } from './asset-labels';
import type { ConfirmRequest } from './confirm-dialog';
import { isTrustedEvent } from './use-edit-action';

const List = styled('ul')(({ theme }) => ({
  display: 'grid',
  gap: 4,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  '& li': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0 8px',
    paddingLeft: 8,
    borderLeft: `2px solid ${theme.palette.divider}`,
  },
  '& code': { overflowWrap: 'anywhere' },
}));

const Note = styled('span')<{ tone?: 'warning' | 'error' }>(({ theme, tone }) => ({
  color: tone === undefined ? theme.palette.text.secondary : theme.palette[tone].main,
  fontSize: 12,
}));

/** 通信先1件に一致する、コードの中の外部通信の行 */
const linesFor = (pattern: string, usage: readonly AssetUsage[]): number[] =>
  usage.flatMap((item) =>
    (item.type === 'proxy' || item.type === 'resource') &&
    item.target !== null &&
    matchExternalTarget(item.target, [pattern])
      ? [item.line]
      : []
  );

/**
 * 外部通信の通信先(1行1パターン)の一覧と編集
 *
 * 編集は「通信先」フィールドの値に対して行い、コメント行は残す。
 * 外すのは安全側なので確認しない。コードが使う未登録の送信先の追加は、確認してから行う
 *
 * @see docs/06-ui.md 5章「権限(カスタマイズ単位)」
 */
export function ExternalUrlEditor(props: {
  asset: Asset;
  usage: readonly AssetUsage[];
  unregistered: readonly UnregisteredTarget[];
  editable: boolean;
  /** 外部通信が「指定先のみ」でない(一覧は残すが、いまは使われない) */
  inactive: boolean;
  busy: boolean;
  save: (externalUrlsText: string) => Promise<boolean>;
  confirm: (request: ConfirmRequest) => Promise<boolean>;
}) {
  const { asset, usage, unregistered, editable, inactive, busy, save, confirm } = props;
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const lines = listExternalUrlLines(asset.externalUrlsText);
  const disabled = !editable || busy;

  const add = async (raw: string): Promise<boolean> => {
    const result = appendExternalPattern(asset.externalUrlsText, raw);
    if (!result.ok) {
      setError(t(`desktop.urls.error.${result.reason}`));
      return false;
    }
    setError('');
    return save(result.text);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    // 通信先を増やす操作なので、利用者の操作によるものだけを受け付ける
    if (!isTrustedEvent(event)) return;
    if (await add(input)) setInput('');
  };

  const addUnregistered = async (target: UnregisteredTarget) => {
    const confirmed = await confirm({
      title: t('desktop.urls.addTitle'),
      body: t('desktop.urls.addBody', target.pattern, formatLines(target.lines)),
      confirmLabel: t('desktop.urls.add'),
    });
    if (confirmed) await add(target.pattern);
  };

  return (
    <div style={{ display: 'grid', gap: 8, paddingLeft: 8 }}>
      {inactive && <Note>{t('desktop.urls.inactive')}</Note>}
      {lines.length === 0 ? (
        <Note>{t('desktop.urls.empty')}</Note>
      ) : (
        <List aria-label={t('desktop.urls.title')}>
          {lines.map(({ line, raw, result }) => {
            const used = result.ok ? linesFor(result.pattern, usage) : [];
            return (
              <li key={line}>
                <code>{result.ok ? result.pattern : raw}</code>
                {result.ok ? (
                  <Note tone={used.length === 0 ? 'warning' : undefined}>
                    {used.length === 0
                      ? `⚠ ${t('desktop.urls.unused')}`
                      : `✓ ${t('desktop.urls.used', formatLines(used))}`}
                  </Note>
                ) : (
                  <Note tone='error'>
                    ✕{' '}
                    {t(
                      'desktop.urls.invalid',
                      String(line),
                      t(`desktop.urls.error.${result.reason}`)
                    )}
                  </Note>
                )}
                {result.ok && result.insecure && (
                  <Note tone='warning'>⚠ {t('desktop.urls.insecure')}</Note>
                )}
                {editable && (
                  <IconButton
                    size='small'
                    disabled={disabled}
                    aria-label={t('desktop.urls.remove', raw)}
                    onClick={() => void save(removeExternalLine(asset.externalUrlsText, line))}
                    sx={{ ml: 'auto' }}
                  >
                    <span aria-hidden='true'>✕</span>
                  </IconButton>
                )}
              </li>
            );
          })}
        </List>
      )}
      {editable && (
        <form onSubmit={(event) => void handleSubmit(event)} style={{ display: 'flex', gap: 8 }}>
          <TextField
            size='small'
            fullWidth
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError('');
            }}
            label={t('desktop.urls.input')}
            error={error !== ''}
            helperText={error || undefined}
            disabled={disabled}
            slotProps={{ htmlInput: { spellCheck: false, inputMode: 'url' } }}
          />
          <Button type='submit' disabled={disabled || input.trim() === ''}>
            {t('desktop.urls.add')}
          </Button>
        </form>
      )}
      {unregistered.length > 0 && (
        <Alert severity='warning'>
          <div>{t('desktop.urls.unregistered')}</div>
          <List>
            {unregistered.map((target) => (
              <li key={target.pattern}>
                <code>{target.pattern}</code>
                <Note>({formatLines(target.lines)})</Note>
                {editable && (
                  <Button
                    size='small'
                    disabled={disabled}
                    onClick={() => void addUnregistered(target)}
                  >
                    {t('desktop.urls.add')}
                  </Button>
                )}
              </li>
            ))}
          </List>
        </Alert>
      )}
      <Note>{t('desktop.urls.literalNote')}</Note>
    </div>
  );
}
