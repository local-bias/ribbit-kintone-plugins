import { type KeyboardEvent, type RefObject, useCallback } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Tabキーのフォーカスを、要素の中で循環させます
 *
 * パネルはkintoneの操作を妨げないよう画面全体を覆わない(aria-modalにしない)が、
 * キーボードでは中に留める(docs/06-ui.md 4章)
 */
export const useFocusCycle = (containerRef: RefObject<HTMLElement | null>) =>
  useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || containerRef.current === null) {
        return;
      }
      const focusable = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [containerRef]
  );
