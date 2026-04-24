// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'uid';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 54583,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.2.0',
      type: 'APP',
      name: {
        en: 'unique ID plugin',
        ja: 'ユニークIDプラグイン',
        zh: '唯一ID插件',
        'zh-TW': '唯一ID插件',
        es: 'plugin de ID único',
        'pt-BR': 'plugin de ID único',
        th: 'ปลั๊กอิน ID ที่ไม่ซ้ำกัน',
      },
      description: {
        en: 'unique ID plugin',
        ja: '一意なIDを発行するプラグイン',
        zh: '唯一ID插件',
        'zh-TW': '唯一ID插件',
        es: 'plugin de ID único',
        'pt-BR': 'plugin de ID único',
        th: 'ปลั๊กอิน ID ที่ไม่ซ้ำกัน',
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
