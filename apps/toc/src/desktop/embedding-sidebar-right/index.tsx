import { store } from '@/lib/store';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { Provider } from 'jotai';
import { createPortal } from 'react-dom';
import { sidebarSelectedAtom } from '../state';
import SidebarContent from './components/sidebar-content';
import TabButton from './components/tab-button';

const SELECTOR = {
  TAB_BUTTON: `.gaia-argoui-app-show-sidebartabs .goog-tab`,
  TAB_BAR_ELEMENT: '.goog-tab-bar',
  SIDEBAR_CONTENT: '.gaia-argoui-app-show-sidebar-content',
};

const ROOT_ELEMENT_ID = 'ribbit-toc-sidebar-right-root';

const componentManager = ComponentManager.getInstance();

export function embeddingSidebarRight() {
  const tabsElement = document.querySelector(SELECTOR.TAB_BAR_ELEMENT);
  const contentElement = document.querySelector(SELECTOR.SIDEBAR_CONTENT);
  if (!tabsElement || !contentElement) {
    console.warn('サイドバータブまたはコンテンツエレメントが見つかりませんでした');
    return;
  }

  // 他のタブボタンがクリックされた場合に非アクティブにする
  const buttons = tabsElement.querySelectorAll(SELECTOR.TAB_BUTTON);
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      store.set(sidebarSelectedAtom, false);
    });
  });

  componentManager.renderComponent({
    id: ROOT_ELEMENT_ID,
    component: (
      <Provider store={store}>
        <TabButton />
        {createPortal(
          <SidebarContent />,
          document.querySelector('.gaia-argoui-app-show-sidebar-content > div') || contentElement
        )}
      </Provider>
    ),
    parentElement: tabsElement,
  });
}
