//@ts-check
const hp = 'https://konomi.app/';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'concatenation';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 24606,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.1.2',
      type: 'APP',
      name: {
        en: 'String Concatenation Plugin',
        ja: '文字列結合プラグイン',
        zh: '字符串拼接插件',
        'zh-TW': '字串拼接插件',
        es: 'Complemento de concatenación de cadenas',
        'pt-BR': 'Plugin de Concatenação de String',
        th: 'ปลั๊กอินการเชื่อมต่อสตริง',
      },
      description: {
        en: 'Perform flexible string concatenation with fields that cannot be used in normal calculations or with app information',
        ja: '通常の計算では使用できないフィールドや、アプリ情報など、柔軟な文字列の結合を行います',
        zh: '使用无法在常规计算中使用的字段或应用程序信息进行灵活的字符串拼接',
        'zh-TW': '使用無法在常規計算中使用的字段或應用程序信息進行靈活的字符串拼接',
        es: 'Realiza una concatenación de cadenas flexible con campos que no se pueden usar en cálculos normales o con información de la aplicación',
        'pt-BR':
          'Realize a concatenação de string flexível com campos que não podem ser usados em cálculos normais ou com informações do aplicativo',
        th: 'ทำการเชื่อมต่อสตริงที่ยืดหยุ่นด้วยฟิลด์ที่ไม่สามารถใช้ในการคำนวณปกติหรือข้อมูลแอป',
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
