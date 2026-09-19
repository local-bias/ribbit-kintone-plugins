import { ErrorBoundary } from '@repo/ui';
import type { ReactNode } from 'react';
import config from '@/../plugin.config.mjs';

/**
 * 設定画面用のエラー境界
 *
 * エラーの内容と対処方法を画面に表示します。`@mui/material`に依存するため、
 * 操作画面では代わりに`src/desktop/components/error-boundary.tsx`を使用します
 * (レコード画面の中に大きなエラー表示を出すとレイアウトが崩れるうえ、
 * 操作画面のバンドルへUIライブラリを取り込むことになるためです)。
 */
export function PluginErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary config={config}>{children}</ErrorBoundary>;
}
