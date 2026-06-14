import { ThemeProvider as MUIThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { getMUITheme } from '../mui-theme';

/**
 * 本プラグイン群共通のブランドテーマ(MUI)を適用するProviderです。
 * ログインユーザーの言語に応じたロケールが反映されます。
 */
export function PluginThemeProvider({ children }: { children: ReactNode }) {
  return <MUIThemeProvider theme={getMUITheme()}>{children}</MUIThemeProvider>;
}
