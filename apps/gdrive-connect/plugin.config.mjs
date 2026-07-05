// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'gdrive-connect';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 37199,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '0.1.0',
      type: 'APP',
      name: {
        en: 'Google Drive Connect',
        ja: 'Googleドライブ連携プラグイン',
        zh: 'Google Drive 集成插件',
        'zh-TW': 'Google Drive 集成插件',
        es: 'Complemento de integración de Google Drive',
        'pt-BR': 'Plugin de integração com o Google Drive',
        th: 'ปลั๊กอินเชื่อมต่อ Google Drive',
      },
      description: {
        en: 'Google Drive Integration Plugin',
        ja: 'Googleドライブと連携するプラグインです',
        zh: 'Google Drive 集成插件',
        'zh-TW': 'Google Drive 集成插件',
        es: 'Complemento de integración de Google Drive',
        'pt-BR': 'Plugin de integração com o Google Drive',
        th: 'แม่แบบปลั๊กอิน',
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
