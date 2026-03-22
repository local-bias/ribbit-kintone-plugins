// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'bulk-file-download';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 7734,
  },
  lint: {
    build: true,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.1.0',
      type: 'APP',
      name: {
        en: 'Bulk File Download Plugin',
        ja: '添付ファイル一括ダウンロードプラグイン',
        zh: '批量文件下载插件',
        'zh-TW': '批量文件下載插件',
        es: 'Plugin de descarga masiva de archivos',
        'pt-BR': 'Plugin de download em massa de arquivos',
        th: 'ปลั๊กอินดาวน์โหลดไฟล์แนบทั้งหมด',
      },
      description: {
        en: 'Download multiple attachment files at once as a ZIP archive.',
        ja: '複数の添付ファイルをZIPファイルにまとめて一括ダウンロードできるプラグインです。',
        zh: '将多个附件文件打包为ZIP文件一次性下载。',
        'zh-TW': '將多個附件文件打包為ZIP文件一次性下載。',
        es: 'Descargue varios archivos adjuntos a la vez como un archivo ZIP.',
        'pt-BR': 'Baixe vários arquivos anexos de uma só vez como um arquivo ZIP.',
        th: 'ดาวน์โหลดไฟล์แนบหลายไฟล์พร้อมกันเป็นไฟล์ ZIP',
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
