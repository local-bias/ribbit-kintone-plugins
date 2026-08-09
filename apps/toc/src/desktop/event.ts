import { listener } from '@/lib/listener';
import { store } from '@/lib/store';
import { css } from '@emotion/css';
import { getSpaceElement } from '@lb-ribbit/kintone-xapp';
import { onTocItemClick } from './actions';
import { embeddingSidebarRight } from './embedding-sidebar-right';
import { embeddingStickyLeft } from './embedding-sticky-left';
import { startHeadingObserver } from './heading-observer';
import { pluginConfigAtom } from './state';
import { isDev } from '@/lib/global';

const TOC_ID = 'ribbit-toc-plugin-root';

listener.add(
  ['app.record.detail.show', 'app.record.create.show', 'app.record.edit.show'],
  async (event) => {
    const { common, conditions } = store.get(pluginConfigAtom);

    if (!conditions.length) {
      return event;
    }

    if (isDev || common.type === 'sticky-left') {
      embeddingStickyLeft();
    }
    if (isDev || common.type === 'sidebar-right') {
      embeddingSidebarRight();
    }

    for (const condition of conditions) {
      const { spaceId, label, color } = condition;
      const spaceElement = getSpaceElement(spaceId);
      if (!spaceElement) {
        console.log('スペースが見つかりませんでした');
        continue;
      }

      spaceElement.innerHTML = `<h2 class=${css`
        font-size: 20px;
        font-weight: 600;
        margin: 32px 0 0;
        border-left: 4px solid ${color};
        padding-left: 16px;
      `}>${label}</h2>`;
    }

    if (document.querySelector(`#${TOC_ID}`)) {
      return event;
    }

    const tocHeading = document.querySelectorAll<HTMLLIElement>('.ribbit-toc-heading');
    for (const heading of Array.from(tocHeading)) {
      heading.addEventListener('click', onTocItemClick);
    }

    // 見出し要素の監視を開始（現在表示中の見出しをハイライト）
    startHeadingObserver();

    return event;
  }
);
