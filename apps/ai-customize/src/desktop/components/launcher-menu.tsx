import { Divider, Menu, MenuItem } from '@mui/material';
import { useAtomValue, useSetAtom } from '@repo/jotai';
import { loadable } from '@repo/jotai/utils';
import { buildNormalModeUrl, buildSafeModeUrl, type PanelTab } from '@/lib/browser-storage';
import { t } from '@/lib/i18n';
import { chatAvailableAtom } from '../states/chat';
import { openPanelAtom, runtimeViewAtom } from '../states/launcher';

const canChatLoadableAtom = loadable(chatAvailableAtom);

/**
 * 起動ボタンのメニュー
 *
 * 件数は「このページで適用中」のもの(無効・ローカル無効を除く)。チャットはAIの設定が済み、許可された人にだけ出す
 *
 * @see docs/06-ui.md 3章
 */
export function LauncherMenu(props: { anchor: HTMLElement | null; onClose: () => void }) {
  const { anchor, onClose } = props;
  const view = useAtomValue(runtimeViewAtom);
  const openPanel = useSetAtom(openPanelAtom);
  const safeMode = view.phase === 'safe-mode';
  const chatAllowed = useAtomValue(canChatLoadableAtom);

  const open = (tab: PanelTab) => {
    openPanel(tab);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchor}
      open={anchor !== null}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <MenuItem onClick={() => open('js')}>
        {t('desktop.menu.js', String(view.applied.js.size))}
      </MenuItem>
      <MenuItem onClick={() => open('css')}>
        {t('desktop.menu.css', String(view.applied.css.size))}
      </MenuItem>
      {chatAllowed.state === 'hasData' && chatAllowed.data && (
        <MenuItem onClick={() => open('chat')}>{t('desktop.menu.chat')}</MenuItem>
      )}
      <Divider />
      <MenuItem
        component='a'
        href={safeMode ? buildNormalModeUrl(location.href) : buildSafeModeUrl(location.href)}
      >
        {t(safeMode ? 'desktop.menu.exitSafeMode' : 'desktop.menu.safeMode')}
      </MenuItem>
    </Menu>
  );
}
