import { commonUi, useTranslations } from '@repo/utils';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';

const ui = mergeDeep(commonUi, {
  ja: {
    'migration.notification':
      'プラグインのバージョンが古くなっています。最新バージョンに更新してください。更新方法はアプリ設定の「プラグイン」をご確認ください。詳細はシステム管理者にお問い合わせください。',
  },
  en: {
    'migration.notification':
      'The plugin version is outdated. Please update to the latest version. For how to update, please check "Plugins" in the app settings. For details, please contact your system administrator.',
  },
  es: {
    'migration.notification':
      'La versión del complemento está desactualizada. Actualice a la última versión. Para saber cómo actualizar, consulte "Complementos" en la configuración de la aplicación. Para más detalles, póngase en contacto con su administrador del sistema.',
  },
  zh: {
    'migration.notification':
      '插件版本过旧。请更新到最新版本。有关如何更新，请检查应用程序设置中的“插件”。有关详细信息，请联系您的系统管理员。',
  },
  'zh-TW': {
    'migration.notification':
      '插件版本過舊。請更新到最新版本。有关如何更新，请检查应用程序设置中的“插件”。有关详细信息，请联系您的系统管理员。',
  },
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});
