import { createTheme } from '@mui/material/styles';

export const myTheme = createTheme({
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&$expanded': {
            margin: 'auto',
          },
          borderRadius: 0,
          border: '1px solid rgba(0, 0, 0, .125)',
        },
      },
    },
  },
});
