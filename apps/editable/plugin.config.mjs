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
      version: '2.0.0',
      type: 'APP',
      name: {
        en: 'Field Dynamic Input Control Plugin',
        ja: '条件付き入力可否制御プラグイン',
        zh: '字段动态输入控制插件',
        'zh-TW': '欄位動態輸入控制插件',
        es: 'Plugin de control dinámico de entrada de campo',
        'pt-BR': 'Plugin de controle dinâmico de entrada de campo',
        th: 'ปลั๊กอินควบคุมการป้อนข้อมูลแบบไดนามิกของฟิลด์',
      },
      description: {
        en: 'Depending on the state of a field, it controls the ability to input other fields.',
        ja: 'フィールドの状態に応じて、他のフィールドの入力可否を制御します。',
        zh: '根据字段的状态，它控制其他字段的输入能力。',
        'zh-TW': '根據欄位的狀態，它控制其他欄位的輸入能力。',
        es: 'Dependiendo del estado de un campo, controla la capacidad de entrada de otros campos.',
        'pt-BR':
          'Dependendo do estado de um campo, ele controla a capacidade de entrada de outros campos.',
        th: 'ขึ้นอยู่กับสถานะของฟิลด์ จะควบคุมความสามารถในการป้อนข้อมูลฟิลด์อื่น ๆ',
      },
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
