import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import invariant from 'tiny-invariant';

/**
 * プラグイン設定画面のReactアプリケーションを、指定した要素にマウントします。
 *
 * @example
 * ```tsx
 * import { renderConfigApp } from '@repo/plugin/react';
 * import { t } from '@/lib/i18n';
 * import App from './app';
 *
 * renderConfigApp(<App />, { errorMessage: t('common.config.error.rootNotFound') });
 * ```
 */
export const renderConfigApp = (
  app: ReactNode,
  options?: { rootId?: string; errorMessage?: string }
) => {
  const { rootId = 'settings', errorMessage } = options ?? {};
  const root = document.getElementById(rootId);
  invariant(root, errorMessage ?? `ルート要素(id="${rootId}")が見つかりませんでした`);
  createRoot(root).render(app);
};
