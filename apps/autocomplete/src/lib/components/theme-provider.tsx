import { ThemeProvider as MUIThemeProvider } from '@mui/material';
import { getMUITheme } from '../i18n';

export function ThemeProvider({ children }: { children: React.ReactNode; }) {
  return <MUIThemeProvider theme={getMUITheme()}>{children}</MUIThemeProvider>;
}
