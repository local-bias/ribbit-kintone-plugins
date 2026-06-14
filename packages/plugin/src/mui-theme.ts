import { createTheme } from '@mui/material';
import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';

type KintoneGlobal = {
  getLoginUser(): { language?: string } | null;
};

/**
 * ログインユーザーの言語設定に対応するMUIのロケールを返します。
 * 利用先のtsconfigに依存しないよう、kintoneグローバルは`globalThis`経由で参照します。
 */
const getMUILang = () => {
  const kintoneGlobal = (globalThis as { kintone?: KintoneGlobal }).kintone;
  const language = kintoneGlobal?.getLoginUser()?.language;
  switch (language) {
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

/**
 * 本プラグイン群共通のブランドテーマ(MUI)を生成します。
 * ログインユーザーの言語に応じたロケールが適用されます。
 */
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
