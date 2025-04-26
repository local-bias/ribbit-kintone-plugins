export const commonUi = {
  ja: {
    'common.config.sidebar.tab.common.label': '共通設定',
    'common.config.sidebar.tab.label': '設定',
    'common.config.button.save': '設定を保存',
    'common.config.button.return': 'プラグイン一覧へ戻る',
    'common.config.toast.save': '設定を保存しました',
    'common.config.toast.reset': '設定をリセットしました',
    'common.config.toast.import': '設定情報をインポートしました',
    'common.config.toast.export': 'プラグインの設定情報をエクスポートしました',
    'common.config.error.rootNotFound':
      'プラグインのHTMLに、ルート要素が存在しません。プラグイン設定をレンダリングするためには、id="settings"の要素が必要です。',
    'common.config.error.import':
      '設定情報のインポートに失敗しました、ファイルに誤りがないか確認してください',
    'common.config.error.export':
      'プラグインの設定情報のエクスポートに失敗しました。プラグイン開発者にお問い合わせください。',
  },
  en: {
    'common.config.sidebar.tab.common.label': 'Common Settings',
    'common.config.sidebar.tab.label': 'Settings',
    'common.config.button.save': 'Save Settings',
    'common.config.button.return': 'Return to Plugin List',
    'common.config.toast.save': 'Settings saved successfully',
    'common.config.toast.reset': 'Settings reset successfully',
    'common.config.toast.import': 'Settings imported successfully',
    'common.config.toast.export': 'Plugin settings exported successfully',
    'common.config.error.rootNotFound':
      'The root element does not exist in the plugin HTML. An element with id="settings" is required to render the plugin settings.',
    'common.config.error.import':
      'Failed to import settings. Please check if there are any errors in the file.',
    'common.config.error.export':
      'Failed to export plugin settings. Please contact the plugin developer.',
  },
  es: {
    'common.config.sidebar.tab.common.label': 'Configuración común',
    'common.config.sidebar.tab.label': 'Configuración',
    'common.config.button.save': 'Guardar configuración',
    'common.config.button.return': 'Volver a la lista de complementos',
    'common.config.toast.save': 'Configuración guardada con éxito',
    'common.config.toast.reset': 'Configuración restablecida con éxito',
    'common.config.toast.import': 'Configuración importada con éxito',
    'common.config.toast.export': 'Configuración del complemento exportada con éxito',
    'common.config.error.rootNotFound':
      'El elemento raíz no existe en el HTML del complemento. Se requiere un elemento con id="settings" para renderizar la configuración del complemento.',
    'common.config.error.import':
      'Error al importar la configuración. Verifique si hay errores en el archivo.',
    'common.config.error.export':
      'Error al exportar la configuración del complemento. Comuníquese con el desarrollador del complemento.',
  },
  zh: {
    'common.config.sidebar.tab.common.label': '通用设置',
    'common.config.sidebar.tab.label': '设置',
    'common.config.button.save': '保存设置',
    'common.config.button.return': '返回插件列表',
    'common.config.toast.save': '设置成功保存',
    'common.config.toast.reset': '设置成功重置',
    'common.config.toast.import': '设置成功导入',
    'common.config.toast.export': '插件设置成功导出',
    'common.config.error.rootNotFound':
      '插件HTML中不存在根元素。需要一个id="settings"的元素来渲染插件设置。',
    'common.config.error.import': '导入设置失败。请检查文件中是否有错误。',
    'common.config.error.export': '导出插件设置失败。请联系插件开发者。',
  },
  'zh-TW': {
    'common.config.sidebar.tab.common.label': '通用設定',
    'common.config.sidebar.tab.label': '設定',
    'common.config.button.save': '保存設定',
    'common.config.button.return': '返回插件列表',
    'common.config.toast.save': '設置成功保存',
    'common.config.toast.reset': '設置成功重置',
    'common.config.toast.import': '設置成功導入',
    'common.config.toast.export': '插件設置成功導出',
    'common.config.error.rootNotFound':
      '插件HTML中不存在根元素。需要一個id="settings"的元素來渲染插件設置。',
    'common.config.error.import': '導入設置失敗。請檢查文件中是否有錯誤。',
    'common.config.error.export': '導出插件設置失敗。請聯繫插件開發者。',
  },
} as const;

/**
 * 指定された言語に対応する翻訳関数を返します。
 * @param lang - 言語のキー
 * @returns 指定された言語に対応する翻訳関数
 */
export function useTranslations<
  UI extends { [lang: string]: { [key: string]: string } },
  Lang extends keyof UI = 'ja',
>(params: { ui: UI; lang: string; defaultLang?: Lang }) {
  const { ui, lang, defaultLang = 'ja' } = params;
  const validLang = lang in ui ? lang : 'ja';

  return function t(key: keyof UI[Lang], ...args: string[]): string {
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    // @ts-ignore デフォルト言語以外の設定が不十分な場合は、デフォルト言語の設定を使用します
    let translation: string = ui[validLang][key] ?? ui[defaultLang][key];

    args.forEach((arg, index) => {
      translation = translation.replace(`{${index}}`, arg);
    });

    return translation;
  };
}
