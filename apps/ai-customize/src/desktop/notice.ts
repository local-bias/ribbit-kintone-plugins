import { NOTICE_ROOT_ID } from '@/lib/constants';
import { whenBodyReady } from './dom';

/**
 * 画面右下に出す最小限の通知
 *
 * セーフモードのように、ランチャーを開かなくても気づいてほしい状態を知らせる。
 * ランチャーの描画に失敗しても出せるよう、Reactを使わない。文字列は全て`textContent`で入れる。
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

const LEVEL_RANK: Record<NoticeLevel, number> = { info: 0, warning: 1, error: 2 };

/**
 * 利用者が閉じた後に、新しい通知を出すか判定します
 *
 * 閉じたものと同じか軽い通知は出さない(何度も出ると邪魔になる)。
 * より重い通知は出す(警告を閉じた後に起きた読み込み失敗などを、黙って隠さない)。
 *
 * @param dismissedLevel 閉じた通知の重要度。まだ閉じていなければ`null`
 */
export const shouldShowAfterDismiss = (
  dismissedLevel: NoticeLevel | null,
  level: NoticeLevel
): boolean => dismissedLevel === null || LEVEL_RANK[level] > LEVEL_RANK[dismissedLevel];

export const createNotice = (dismissLabel: string): Notice => {
  let root: HTMLElement | null = null;
  let current: NoticeLevel | null = null;
  let dismissedLevel: NoticeLevel | null = null;

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
      dismissedLevel = current;
      root?.remove();
    });

    current = content.level;
    root.replaceChildren(message, ...actions, dismiss);
    if (!root.isConnected) {
      document.body.appendChild(root);
    }
  };

  return {
    show: (content) => {
      if (!shouldShowAfterDismiss(dismissedLevel, content.level)) {
        return;
      }
      whenBodyReady(() => render(content));
    },
  };
};
