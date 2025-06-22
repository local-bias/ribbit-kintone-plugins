// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'template';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 16801,
  },
  lint: {
    build: true,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '0.1.0',
      type: 'APP',
      name: {
        en: 'my theme',
        ja: 'マイテーマ',
        zh: '我的主题',
        'zh-TW': '我的主題',
        es: 'mi tema',
        'pt-BR': 'meu tema',
        th: 'ธีมของฉัน',
      },
      description: {
        en: 'Plugin to apply a custom theme.',
        ja: '独自のテーマを適用するプラグインです。',
        zh: '应用自定义主题的插件。',
        'zh-TW': '應用自定義主題的插件。',
        es: 'Plugin para aplicar un tema personalizado.',
        'pt-BR': 'Plugin para aplicar um tema personalizado.',
        th: 'ปลั๊กอินสำหรับใช้ธีมที่กำหนดเอง',
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
