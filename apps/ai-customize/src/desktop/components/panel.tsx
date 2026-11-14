import { IconButton, Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAtom, useAtomValue } from '@repo/jotai';
import { loadable } from '@repo/jotai/utils';
import { type KeyboardEvent, Suspense, useEffect, useId, useRef } from 'react';
import type { PanelTab } from '@/lib/browser-storage';
import { LAUNCHER_Z_INDEX } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { draggingAtom } from '../states/asset-edit';
import { chatAvailableAtom } from '../states/chat';
import { panelStateAtom, selectedAssetIdAtom } from '../states/launcher';
import { AssetDetail } from './asset-detail';
import { AssetList } from './asset-list';
import { ChatPanel } from './chat/chat-panel';
import { PanelErrorBoundary, PanelLoading } from './panel-fallback';
import { StatusBanner } from './status-banner';
import { useFocusCycle } from './use-focus-cycle';
import { useBeforeUnloadGuard, useUnsavedGuard } from './use-unsaved-guard';

const canChatLoadableAtom = loadable(chatAvailableAtom);

/** IMEが変換中のキー入力で報告する`keyCode` */
const IME_PROCESS_KEY_CODE = 229;

const Root = styled('section')(({ theme }) => ({
  position: 'fixed',
  right: 24,
  bottom: 96,
  zIndex: LAUNCHER_Z_INDEX,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  width: 'min(480px, calc(100vw - 32px))',
  height: 'min(640px, calc(100vh - 120px))',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[12],
  fontSize: 13,
  lineHeight: 1.6,
  textAlign: 'left',
  overflow: 'hidden',
  '@media (max-width: 480px)': { right: 16, left: 16, width: 'auto', bottom: 84 },
}));

const Header = styled('header')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '8px 8px 0 16px',
  '& h2': {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: theme.palette.text.primary,
    outline: 'none',
  },
}));

const Body = styled('div')({
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
});

/**
 * JS / CSS一覧と詳細を出すパネル
 *
 * - 開いたら見出しへフォーカスを移し、Tabはパネル内で循環させ、閉じたら起動ボタンへ戻す
 * - `Escape`で閉じる。パネルの外をクリックしても閉じない(作業中に消えないように)
 *
 * @see docs/06-ui.md 4章
 */
export function Panel(props: { onClosed: () => void }) {
  const [state, setState] = useAtom(panelStateAtom);
  const [selected, setSelected] = useAtom(selectedAssetIdAtom);
  const rootRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const cycleFocus = useFocusCycle(rootRef);
  const guardUnsaved = useUnsavedGuard();
  const dragging = useAtomValue(draggingAtom);
  const chatAllowed = useAtomValue(canChatLoadableAtom);
  // 判定が済むまでは出さない(判定中・失敗は使えないものとして扱う)
  const showChat = chatAllowed.state === 'hasData' && chatAllowed.data;
  const tab: PanelTab = state.tab === 'chat' && !showChat ? 'js' : state.tab;
  useBeforeUnloadGuard();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // 一覧と詳細の行き来・削除・複製で、フォーカスしていた要素が消えたら見出しへ戻す
  // (bodyに落ちると`Escape`もTabの循環も効かなくなる)
  // biome-ignore lint/correctness/useExhaustiveDependencies: 表示する画面が変わったときに確かめる
  useEffect(() => {
    if (document.activeElement === null || document.activeElement === document.body) {
      headingRef.current?.focus();
    }
  }, [selected, state.tab]);

  const close = () => {
    if (!guardUnsaved()) return;
    setState({ open: false });
    props.onClosed();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // キーボードでのドラッグの取り消しと、IMEの変換の取り消しでは閉じない
    const composing = event.nativeEvent.isComposing || event.keyCode === IME_PROCESS_KEY_CODE;
    if (event.key === 'Escape' && !event.defaultPrevented && !dragging && !composing) {
      event.stopPropagation();
      close();
      return;
    }
    cycleFocus(event);
  };

  const changeTab = (tab: PanelTab) => {
    if (!guardUnsaved()) return;
    setState({ tab });
    setSelected(null);
  };

  return (
    <Root ref={rootRef} role='dialog' aria-labelledby={headingId} onKeyDown={handleKeyDown}>
      <Header>
        <h2 id={headingId} ref={headingRef} tabIndex={-1}>
          {t('desktop.panel.title')}
        </h2>
        <IconButton aria-label={t('desktop.panel.close')} onClick={close} size='small'>
          <span aria-hidden='true'>✕</span>
        </IconButton>
      </Header>
      <Tabs
        value={tab}
        onChange={(_, next: PanelTab) => changeTab(next)}
        variant='fullWidth'
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
      >
        <Tab value='js' label={t('desktop.panel.tab.js')} sx={{ minHeight: 40 }} />
        <Tab value='css' label={t('desktop.panel.tab.css')} sx={{ minHeight: 40 }} />
        {showChat && (
          <Tab value='chat' label={t('desktop.panel.tab.chat')} sx={{ minHeight: 40 }} />
        )}
      </Tabs>
      <StatusBanner />
      <Body>
        <PanelErrorBoundary>
          <Suspense fallback={<PanelLoading />}>
            {tab === 'chat' ? (
              <ChatPanel />
            ) : selected === null ? (
              <AssetList kind={tab} />
            ) : (
              <AssetDetail key={selected} assetId={selected} onBack={() => setSelected(null)} />
            )}
          </Suspense>
        </PanelErrorBoundary>
      </Body>
    </Root>
  );
}
