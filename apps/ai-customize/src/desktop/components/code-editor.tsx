import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtom, useSetAtom } from '@repo/jotai';
import { type MouseEvent, useRef } from 'react';
import { MAX_CODE_BYTES } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { Asset } from '@/schema/asset';
import { codeDraftAtom, isStaleDraft, saveAssetAtom } from '../states/asset-edit';
import { isTrustedEvent, useEditAction } from './use-edit-action';

const MONOSPACE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const LINE_HEIGHT = 1.6;

const Frame = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  height: 360,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 6,
  overflow: 'hidden',
  fontFamily: MONOSPACE,
  fontSize: 12,
  lineHeight: LINE_HEIGHT,
  '&:focus-within': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 1 },
}));

const Gutter = styled('pre')(({ theme }) => ({
  margin: 0,
  padding: '8px 8px 8px 12px',
  overflow: 'hidden',
  borderRight: `1px solid ${theme.palette.divider}`,
  background: theme.palette.action.hover,
  color: theme.palette.text.disabled,
  font: 'inherit',
  textAlign: 'right',
  userSelect: 'none',
}));

const Area = styled('textarea')(({ theme }) => ({
  margin: 0,
  padding: 8,
  border: 0,
  outline: 'none',
  resize: 'none',
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  font: 'inherit',
  whiteSpace: 'pre',
  tabSize: 2,
}));

const encoder = new TextEncoder();

const countLines = (code: string): number => code.split(/\r\n|\r|\n/).length;

/**
 * 行番号つきのコード編集
 *
 * 構文ハイライトはv1では入れない(バンドルサイズ優先)。AIを介さずに直せる逃げ道として、手動編集を必ず残す。
 * 編集中の内容は`codeDraftAtom`に置き、パネルを閉じる・戻る・画面遷移の前に破棄を確認する
 *
 * @see docs/06-ui.md 4章・5章「詳細(コード表示)」
 */
export function CodeEditor(props: { asset: Asset; label: string }) {
  const { asset, label } = props;
  const [draft, setDraft] = useAtom(codeDraftAtom);
  const save = useSetAtom(saveAssetAtom);
  const [busy, run] = useEditAction();
  const gutterRef = useRef<HTMLPreElement>(null);

  const code = draft?.assetId === asset.id ? draft.code : asset.code;
  const dirty = code !== asset.code;
  const tooLarge = encoder.encode(code).length > MAX_CODE_BYTES;

  const stale = isStaleDraft(draft, asset);

  const handleChange = (value: string) =>
    setDraft(
      value === asset.code
        ? null
        : {
            assetId: asset.id,
            code: value,
            // 編集を始めたときの版を覚える(続けて編集しても変えない)
            baseRevision: draft?.assetId === asset.id ? draft.baseRevision : asset.revision,
          }
    );

  const handleSave = (event: MouseEvent) => {
    if (!isTrustedEvent(event)) return;
    void run(() => save({ asset, patch: { code } }));
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Frame>
        <Gutter ref={gutterRef} aria-hidden='true'>
          {Array.from({ length: countLines(code) }, (_, index) => index + 1).join('\n')}
        </Gutter>
        <Area
          value={code}
          onChange={(event) => handleChange(event.target.value)}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          aria-label={label}
          spellCheck={false}
          autoCapitalize='off'
          autoComplete='off'
          wrap='off'
          readOnly={busy}
        />
      </Frame>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <Button
          variant='contained'
          size='small'
          disabled={!dirty || busy || tooLarge || stale}
          onClick={handleSave}
        >
          {t('desktop.code.save')}
        </Button>
        <Button size='small' disabled={!dirty || busy} onClick={() => setDraft(null)}>
          {t('desktop.code.discard')}
        </Button>
        <span role='status' style={{ fontSize: 12 }}>
          {stale
            ? `⚠ ${t('desktop.code.stale')}`
            : tooLarge
              ? `⚠ ${t('desktop.code.tooLarge', String(MAX_CODE_BYTES / 1024))}`
              : dirty
                ? t('desktop.code.unsaved')
                : ''}
        </span>
      </div>
    </div>
  );
}
