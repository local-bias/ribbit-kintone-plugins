// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'pdf-preview';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 26560,
  },
  lint: {
    build: true,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.0.1',
      type: 'APP',
      name: {
        en: 'PDF Preview Plugin',
        ja: 'PDFプレビュープラグイン',
        zh: 'PDF预览插件',
        'zh-TW': 'PDF預覽插件',
        es: 'Plugin de vista previa de PDF',
        'pt-BR': 'Plugin de visualização de PDF',
        th: 'ปลั๊กอินตัวอย่าง PDF',
      },
      description: {
        en: 'This plugin allows you to preview and print PDF files attached to file fields without downloading them.',
        ja: 'ファイルフィールドに添付されたPDFファイルを、ダウンロードすることなくプレビュー、印刷することができるプラグインです。',
        zh: '此插件允许您预览和打印附加到文件字段的PDF文件，而无需下载它们。',
        'zh-TW': '此插件允許您預覽和列印附加到檔案欄位的PDF檔案，而無需下載它們。',
        es: 'Este complemento le permite previsualizar e imprimir archivos PDF adjuntos a campos de archivo sin descargarlos.',
        'pt-BR':
          'Este plugin permite que você visualize e imprima arquivos PDF anexados a campos de arquivo sem baixá-los.',
        th: 'ปลั๊กอินนี้ช่วยให้คุณสามารถดูตัวอย่างและพิมพ์ไฟล์ PDF ที่แนบมากับฟิลด์ไฟล์ได้โดยไม่ต้องดาวน์โหลด',
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
