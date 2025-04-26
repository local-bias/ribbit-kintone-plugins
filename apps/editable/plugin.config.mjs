// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'editable';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 5500,
  },
  lint: {
    build: false,
  },
  // tailwind: {
  //   css: 'src/styles/global.css',
  //   config: {
  //     desktop: 'tailwind.config.desktop.mjs',
  //     config: 'tailwind.config.config.mjs',
  //   },
  // },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.3.0',
      type: 'APP',
      name: {
        en: 'Field Dynamic Input Control Plugin',
        ja: 'フィールド動的入力制御プラグイン',
        zh: '插件模板',
      },
      description: {
        en: 'Depending on the state of a field, it controls the ability to input other fields.',
        ja: 'フィールドの状態に応じて、他のフィールドの入力可否を制御します。',
        zh: '插件模板',
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
