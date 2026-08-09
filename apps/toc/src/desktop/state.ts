import { getSidebarDisplayState, updateSidebarState } from '@/lib/kintone-js-api';
import { restorePluginConfig } from '@/lib/plugin';
import { css } from '@emotion/css';
import { atom } from 'jotai';

export const pluginConfigAtom = atom(restorePluginConfig());

export const sidebarSelectedAtom = atom<boolean>(false);

export const toggleSidebarAtom = atom(null, async (get, set) => {
  try {
    // クリック時点の選択状態
    const selected = get(sidebarSelectedAtom);

    console.log('toggleSidebarAtom called', { selected });

    // クリック後のサイドバー表示状態
    const toggled = !selected;

    const currentSidebarState = await getSidebarDisplayState();

    if (toggled && currentSidebarState !== 'CLOSED') {
      await updateSidebarState('CLOSED');
    }

    handleTocContent(toggled);
  } catch (error) {
    console.error('Error in toggleSidebarAtom:', error);
  } finally {
    set(sidebarSelectedAtom, (prev) => !prev);
  }
});

const SELECTOR = {
  SIDEBAR_CONTAINER: '.gaia-argoui-app-show-sidebar-dragged',
  SIDEBAR_DRAG_HANDLE: '.gaia-argoui-app-show-sidebar-dragger',
};
function handleTocContent(show: boolean) {
  console.log('handleTocContent', show);
  [SELECTOR.SIDEBAR_CONTAINER, SELECTOR.SIDEBAR_DRAG_HANDLE].forEach((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      if (show) {
        element.classList.add(forceVisibleClassName);
      } else {
        element.classList.remove(forceVisibleClassName);
      }
    }
  });
}
const forceVisibleClassName = css`
  display: block !important;
`;
