import { createTheme } from '@mui/material';
import { LANGUAGE } from './global';
import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';

export const ui = {
  ja: {
    'common.cancel': 'キャンセル',
    'common.clear': 'クリア',
    'common.get': '取得',
  },
  en: {
    'common.cancel': 'Cancel',
    'common.clear': 'Clear',
    'common.get': 'Get',
  },
  es: {
    'common.cancel': 'Cancelar',
    'common.clear': 'Limpiar',
    'common.get': 'Obtener',
  },
  zh: {
    'common.cancel': '取消',
    'common.clear': '清除',
    'common.get': '获取',
  },
  'zh-TW': {
    'common.cancel': '取消',
    'common.clear': '清除',
    'common.get': '取得',
  },
} as const;

export type Language = keyof typeof ui;

export const defaultLang = 'ja' satisfies Language;

const isSupportedLang = (lang: string): lang is Language => lang in ui;

/**
 * 指定された言語に対応する翻訳関数を返します。
 * @param lang - 言語のキー
 * @returns 指定された言語に対応する翻訳関数
 */
export function useTranslations(lang: string) {
  const validLang = isSupportedLang(lang) ? lang : defaultLang;

  return function t(key: keyof (typeof ui)[typeof defaultLang], ...args: string[]): string {
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    // @ts-ignore デフォルト言語以外の設定が不十分な場合は、デフォルト言語の設定を使用します
    let translation: string = ui[validLang][key] ?? ui[defaultLang][key];

    // プレースホルダーを置換
    args.forEach((arg, index) => {
      translation = translation.replace(`{${index}}`, arg);
    });

    return translation;
  };
}

export const t = useTranslations(LANGUAGE);

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
    },
    getMUILang()
  );
};
