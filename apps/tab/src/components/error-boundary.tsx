import { ErrorBoundary } from '@repo/ui';
import type { ReactNode } from 'react';
import config from '@/../plugin.config.mjs';

export function PluginErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary config={config}>{children}</ErrorBoundary>;
}
