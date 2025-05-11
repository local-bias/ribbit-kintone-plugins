// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';

export const pluginReleasePageUrl = 'https://ribbit.konomi.app/kintone-plugin/';

/** @satisfies { Partial<Plugin.Meta.Config["manifest"]["base"]> } */
export const manifestBase = /** @type { const } */ ({
  manifest_version: 1,
  type: 'APP',
  icon: 'icon.png',
  homepage_url: { ja: hp, en: hp, zh: hp, 'zh-TW': hp, es: hp, 'pt-BR': hp, th: hp },
  desktop: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
  mobile: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
  config: {
    html: 'config.html',
    js: [`${cdn}/common/config.js`],
    css: [`${cdn}/common/config.css`],
    required_params: [],
  },
});

/** @satisfies { Plugin.Meta.Config["manifest"]["standalone"] } */
export const defaultStandalone = {
  desktop: { js: ['desktop.js'], css: ['desktop.css'] },
  mobile: { js: ['desktop.js'], css: ['desktop.css'] },
  config: { js: ['config.js'], css: ['config.css'] },
};

/**
 *
 * @param { string } key
 * @returns { Plugin.Meta.Config["manifest"]["prod"] }
 */
export function createProdManifest(key) {
  return {
    desktop: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
    mobile: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
    config: { js: [`${cdn}/${key}/config.js`], css: [`${cdn}/${key}/config.css`] },
  };
}

/**
 * @param { string } key
 * @returns
 */
export function defineConfig(key) {
  return /** @type { const } */ ({
    id: `ribbit-kintone-plugin-${key}`,
    pluginReleasePageUrl,
    lint: {
      build: true,
    },
    manifest: {
      base: /** @satisfies { Partial<Plugin.Meta.Config["manifest"]["base"]> } */ ({
        manifest_version: 1,
        type: 'APP',
        icon: 'icon.png',
        homepage_url: { ja: hp, en: hp, zh: hp, 'zh-TW': hp, es: hp, 'pt-BR': hp, th: hp },
        desktop: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
        mobile: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
        config: {
          html: 'config.html',
          js: [`${cdn}/common/config.js`],
          css: [`${cdn}/common/config.css`],
          required_params: [],
        },
      }),
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
}
