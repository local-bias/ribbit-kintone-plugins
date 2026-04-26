// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'ai-output';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 8011,
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
        en: 'AI Output Plugin',
        ja: 'AI自動入力プラグイン',
        zh: 'AI自動輸入插件',
        'zh-TW': 'AI自動輸入插件',
        es: 'Plugin de entrada AI',
        'pt-BR': 'Plugin de entrada AI',
        th: 'ปลั๊กอิน AI การป้อนข้อมูลอัตโนมัติ',
      },
      description: {
        en: 'Sends record data to OpenAI and writes structured inference results to specified fields.',
        ja: 'レコード情報や他アプリの情報から、特定のフィールドをAIを使って自動入力するプラグインです。',
        zh: '将记录数据发送到OpenAI并将结构化推理结果写入指定字段。',
        'zh-TW': '將記錄數據發送到OpenAI並將結構化推理結果寫入指定欄位。',
        es: 'Envía datos de registro a OpenAI y escribe resultados de inferencia estructurados en campos especificados.',
        'pt-BR':
          'Envia dados de registro para OpenAI e grava resultados de inferência estruturados em campos especificados.',
        th: 'ส่งข้อมูลเรกคอร์ดไปยัง OpenAI และเขียนผลการอนุมานที่มีโครงสร้างไปยังฟิลด์ที่ระบุ',
      },
      icon: 'icon.png',
      homepage_url: { ja: hp, en: hp },
      desktop: {
        js: [`${cdn}/common/desktop.js`],
        css: [`${cdn}/common/desktop.css`],
      },
      mobile: {
        js: [`${cdn}/common/desktop.js`],
        css: [`${cdn}/common/desktop.css`],
      },
      config: {
        html: 'config.html',
        js: [`${cdn}/common/config.js`],
        css: [`${cdn}/common/config.css`],
        required_params: [],
      },
    },
    prod: {
      desktop: {
        js: [`${cdn}/${key}/desktop.js`],
        css: [`${cdn}/${key}/desktop.css`],
      },
      mobile: {
        js: [`${cdn}/${key}/desktop.js`],
        css: [`${cdn}/${key}/desktop.css`],
      },
      config: {
        js: [`${cdn}/${key}/config.js`],
        css: [`${cdn}/${key}/config.css`],
      },
    },
    standalone: {
      desktop: { js: ['desktop.js'], css: ['desktop.css'] },
      mobile: { js: ['desktop.js'], css: ['desktop.css'] },
      config: { js: ['config.js'], css: ['config.css'] },
    },
  },
});
