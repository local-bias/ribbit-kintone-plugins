import { createTheme } from '@mui/material';
import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';
import { LANGUAGE } from './global';

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
    },
    getMUILang()
  );
};
