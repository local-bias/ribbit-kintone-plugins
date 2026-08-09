import { store } from '@/lib/store';
import { css } from '@emotion/css';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { Provider } from 'jotai';
import { StickyLeftEmbedding } from './components';

const TOC_ID = 'ribbit-toc-plugin-root';

const componentManager = ComponentManager.getInstance();

export function embeddingStickyLeft() {
  const target = document.querySelector('#record-gaia');
  if (!target) {
    console.log('タブをレンダリングする対象エレメントが取得できませんでした');
    return;
  }
  target.classList.add(css`
    padding: 0 !important;
    display: flex;
    gap: 8px;
  `);

  componentManager.renderComponent({
    id: TOC_ID,
    component: (
      <Provider store={store}>
        <StickyLeftEmbedding />
      </Provider>
    ),
    parentElement: target,
    prepend: true,
  });
}

