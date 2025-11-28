// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'validation';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 65535,
  },
  lint: {
    build: true,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.0.0',
      type: 'APP',
      name: {
        en: 'Validation Plugin',
        ja: '入力チェックプラグイン',
        zh: '输入验证插件',
        'zh-TW': '輸入驗證插件',
        es: 'Plugin de validación',
        'pt-BR': 'Plugin de validação',
        th: 'ปลั๊กอินตรวจสอบข้อมูล',
      },
      description: {
        en: 'A plugin that provides flexible input validation for kintone records.',
        ja: 'レコードの入力内容に対して柔軟なバリデーションチェックを行うプラグインです。必須入力、文字数制限、正規表現パターンなど、様々なチェックルールを設定できます。',
        zh: '为kintone记录提供灵活的输入验证的插件。',
        'zh-TW': '為kintone記錄提供靈活的輸入驗證的插件。',
        es: 'Un plugin que proporciona validación de entrada flexible para registros de kintone.',
        'pt-BR': 'Um plugin que fornece validação de entrada flexível para registros do kintone.',
        th: 'ปลั๊กอินที่ให้การตรวจสอบข้อมูลที่ยืดหยุ่นสำหรับบันทึก kintone',
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
