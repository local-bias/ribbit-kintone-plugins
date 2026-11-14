import { NOTICE_ROOT_ID } from '@/lib/constants';

/**
 * 画面右下に出す最小限の通知
 *
 * ランチャー(docs/06-ui.md)を実装するまでの間、セーフモード・読み込み失敗・権限による停止などを
 * 利用者に知らせる。Reactを読み込まず、文字列は全て`textContent`で入れる。
 */

export type NoticeLevel = 'info' | 'warning' | 'error';

export type NoticeContent = {
  level: NoticeLevel;
  message: string;
  actions: { label: string; href: string }[];
};

export type Notice = {
  show: (content: NoticeContent) => void;
};

/** `document.body`が用意されてから実行します(desktop.jsは本文より先に読まれうる) */
const whenBodyReady = (callback: () => void): void => {
  if (document.body) {
    callback();
    return;
  }
  document.addEventListener('DOMContentLoaded', callback, { once: true });
};

export const createNotice = (dismissLabel: string): Notice => {
  let root: HTMLElement | null = null;
  let dismissed = false;

  const render = (content: NoticeContent) => {
    root ??= document.createElement('div');
    root.id = NOTICE_ROOT_ID;
    root.className = '🐸';
    root.dataset.level = content.level;
    root.setAttribute('role', content.level === 'error' ? 'alert' : 'status');

    const message = document.createElement('p');
    message.textContent = content.message;

    const actions = content.actions.map(({ label, href }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      return link;
    });

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = dismissLabel;
    dismiss.addEventListener('click', () => {
      dismissed = true;
      root?.remove();
    });

    root.replaceChildren(message, ...actions, dismiss);
    if (!root.isConnected) {
      document.body.appendChild(root);
    }
  };

  return {
    show: (content) => {
      if (dismissed) {
        return;
      }
      whenBodyReady(() => render(content));
    },
  };
};
