import { useAtom } from '@repo/jotai';
import { useRef, useState } from 'react';
import { panelStateAtom } from '../states/launcher';
import { LauncherButton } from './launcher-button';
import { LauncherMenu } from './launcher-menu';
import { Panel } from './panel';
import { useUnsavedGuard } from './use-unsaved-guard';

/**
 * 画面右下の起動ボタン・メニュー・パネル
 *
 * @see docs/06-ui.md 2〜4章
 */
export function Launcher() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [panel, setPanel] = useAtom(panelStateAtom);
  const guardUnsaved = useUnsavedGuard();

  /** パネルを開いているときは閉じる(メニューをパネルに重ねない)。閉じているときはメニューを開く */
  const handleClick = (anchor: HTMLElement) => {
    if (panel.open) {
      if (guardUnsaved()) setPanel({ open: false });
      return;
    }
    setMenuAnchor(anchor);
  };

  return (
    <>
      <LauncherButton
        ref={buttonRef}
        expanded={panel.open || menuAnchor !== null}
        menuOpen={menuAnchor !== null}
        onClick={(event) => handleClick(event.currentTarget)}
      />
      <LauncherMenu anchor={menuAnchor} onClose={() => setMenuAnchor(null)} />
      {panel.open && <Panel onClosed={() => buttonRef.current?.focus()} />}
    </>
  );
}
