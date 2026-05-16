// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'ai-butler';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 65535,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '0.1.0',
      type: 'APP',
      name: {
        en: 'AI Butler',
        ja: 'AIバトラー',
        zh: 'AI管家',
        'zh-TW': 'AI管家',
        es: 'AI Butler',
        'pt-BR': 'AI Butler',
        th: 'AI Butler',
      },
      description: {
        en: 'A resident AI assistant that provides chat, file completion, and input prediction on kintone screens.',
        ja: '画面に常駐し、AIチャット・ファイル添付による補完・入力予測など多彩な支援を提供するプラグインです。',
        zh: '常驻在画面上，提供AI聊天、文件补全和输入预测等多种支持的插件。',
        'zh-TW': '常駐在畫面上，提供AI聊天、檔案補全和輸入預測等多種支援的外掛。',
        es: 'Asistente IA residente que ofrece chat, autocompletado de archivos y predicción de entrada en kintone.',
        'pt-BR':
          'Assistente de IA residente com chat, preenchimento por anexo de arquivo e predição de entrada no kintone.',
        th: 'ผู้ช่วย AI ที่ฝังอยู่ในหน้าจอเพื่อช่วยแชท เติมจากไฟล์ และทำนายการป้อนข้อมูล',
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
