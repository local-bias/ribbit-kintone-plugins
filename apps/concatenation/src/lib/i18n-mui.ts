import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';
import { LANGUAGE } from './global';
import { createTheme } from '@mui/material';

const getMUILang = () => {
  switch (LANGUAGE) {
    case 'en': {
      return enUS;
    }
    case 'zh': {
      return zhCN;
    }
    case 'es': {
      return esES;
    }
    case 'ja':
    default: {
      return jaJP;
    }
  }
};

export const getMUITheme = () => {
  return createTheme(
    {
      palette: {
        primary: {
          main: '#3498db',
        },
      },
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
    },
    getMUILang()
  );
};
