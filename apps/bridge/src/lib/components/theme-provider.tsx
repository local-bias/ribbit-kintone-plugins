import { ThemeProvider as MUIThemeProvider } from '@mui/material';
import React, { type FC, type PropsWithChildren } from 'react';
import { getMUITheme } from '../i18n';

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => (
  <MUIThemeProvider theme={getMUITheme()}>{children}</MUIThemeProvider>
);
