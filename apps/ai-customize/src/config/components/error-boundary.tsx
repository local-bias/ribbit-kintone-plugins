import { ErrorBoundary } from '@repo/ui';
import type { ReactNode } from 'react';
import config from '@/../plugin.config.mjs';

/** 設定画面用のエラー境界。エラーの内容と対処方法を画面に表示します */
export function PluginErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary config={config}>{children}</ErrorBoundary>;
}
