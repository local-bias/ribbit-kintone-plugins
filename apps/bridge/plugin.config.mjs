// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'update-bridge';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 26553,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '3.1.1',
      type: 'APP',
      name: {
        en: 'Update Other App Plugin',
        ja: 'アプリ間連携プラグイン',
        zh: '更新其他应用程序插件',
        'zh-TW': '更新其他應用程式外掛程式',
        es: 'Plugin de actualización de otras aplicaciones',
        'pt-BR': 'Plugin de atualização de outro aplicativo',
        th: 'ปลั๊กอินอัปเดตแอปอื่น',
      },
      description: {
        en: 'When a record in the app is updated, it updates the records of other related apps.',
        ja: 'アプリのレコードが更新された際に、関連する他アプリのレコードを更新します',
        zh: '当应用程序中的记录更新时，它会更新其他相关应用程序的记录。',
        'zh-TW': '當應用程式中的記錄更新時，它會更新其他相關應用程式的記錄。',
        es: 'Cuando se actualiza un registro en la aplicación, actualiza los registros de otras aplicaciones relacionadas.',
        'pt-BR':
          'Quando um registro no aplicativo é atualizado, ele atualiza os registros de outros aplicativos relacionados.',
        th: 'เมื่อมีการอัปเดตระเบียนในแอป จะอัปเดตระเบียนของแอปอื่นที่เกี่ยวข้อง',
      },
      icon: 'icon.png',
      homepage_url: { ja: hp, en: hp },
      desktop: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
      mobile: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
      config: {
        html: 'config.html',
        js: [`${cdn}/common/config.js`],
        css: [`${cdn}/common/config.css`],
        required_params: [],
      },
    },
    prod: {
      desktop: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
      mobile: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
      config: { js: [`${cdn}/${key}/config.js`], css: [`${cdn}/${key}/config.css`] },
    },
    standalone: {
      desktop: { js: ['desktop.js'], css: ['desktop.css'] },
      mobile: { js: ['desktop.js'], css: ['desktop.css'] },
      config: { js: ['config.js'], css: ['config.css'] },
    },
  },
});
