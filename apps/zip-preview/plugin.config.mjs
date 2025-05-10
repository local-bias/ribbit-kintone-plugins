// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'zip-preview';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 55381,
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
        en: 'ZIP File Preview Plugin',
        ja: 'ZIPファイルプレビュープラグイン',
        zh: 'ZIP文件预览插件',
        'zh-TW': 'ZIP文件預覽插件',
        es: 'Plugin de vista previa de archivos ZIP',
        'pt-BR': 'Plugin de visualização de arquivos ZIP',
        th: 'ปลั๊กอินตัวอย่างไฟล์ ZIP',
      },
      description: {
        en: 'This plugin allows you to preview the contents of a ZIP file uploaded to a file field without downloading it.',
        ja: 'ファイルフィールドにアップロードしたZIPファイルを、ダウンロードすることなく中身をプレビューすることができるプラグインです。',
        zh: '此插件允许您预览上传到文件字段的ZIP文件的内容，而无需下载它。',
        'zh-TW': '此插件允許您預覽上傳到文件字段的ZIP文件的內容，而無需下載它。',
        es: 'Este complemento le permite previsualizar el contenido de un archivo ZIP cargado en un campo de archivo sin descargarlo.',
        'pt-BR':
          'Este plugin permite que você visualize o conteúdo de um arquivo ZIP enviado para um campo de arquivo sem baixá-lo.',
        th: 'ปลั๊กอินนี้ช่วยให้คุณสามารถดูเนื้อหาของไฟล์ ZIP ที่อัปโหลดไปยังฟิลด์ไฟล์ได้โดยไม่ต้องดาวน์โหลด',
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
