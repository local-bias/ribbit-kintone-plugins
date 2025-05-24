import { ThemeProvider as MUIThemeProvider } from '@mui/material';
import { getMUITheme } from '../lib/i18n-mui';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <MUIThemeProvider theme={getMUITheme()}>{children}</MUIThemeProvider>;
}
