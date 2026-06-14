// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'attachment-preview';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 45381,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.0.0',
      type: 'APP',
      name: {
        en: 'Attachment File Preview Plugin',
        ja: '添付ファイルプレビュープラグイン',
        zh: '附件文件预览插件',
        'zh-TW': '附件文件預覽插件',
        es: 'Plugin de vista previa de archivos adjuntos',
        'pt-BR': 'Plugin de visualização de arquivos anexados',
        th: 'ปลั๊กอินตัวอย่างไฟล์แนบ',
      },
      description: {
        en: 'This plugin lets you preview a wide range of attached file formats (images, PDF, Office documents, audio, video, text, archives, and more) uploaded to a file field, without downloading them.',
        ja: 'ファイルフィールドにアップロードした様々な形式の添付ファイル（画像・PDF・Officeドキュメント・音声・動画・テキスト・アーカイブなど）を、ダウンロードすることなくプレビューできるプラグインです。',
        zh: '此插件允许您预览上传到文件字段的多种格式的附件（图像、PDF、Office文档、音频、视频、文本、压缩包等），而无需下载它们。',
        'zh-TW':
          '此插件允許您預覽上傳到文件字段的多種格式的附件（圖像、PDF、Office文檔、音訊、視訊、文字、壓縮檔等），而無需下載它們。',
        es: 'Este complemento le permite previsualizar una amplia variedad de formatos de archivos adjuntos (imágenes, PDF, documentos de Office, audio, video, texto, archivos comprimidos y más) sin descargarlos.',
        'pt-BR':
          'Este plugin permite visualizar uma ampla variedade de formatos de arquivos anexados (imagens, PDF, documentos do Office, áudio, vídeo, texto, arquivos compactados e muito mais) sem baixá-los.',
        th: 'ปลั๊กอินนี้ช่วยให้คุณสามารถดูตัวอย่างไฟล์แนบหลากหลายรูปแบบ (รูปภาพ, PDF, เอกสาร Office, เสียง, วิดีโอ, ข้อความ, ไฟล์บีบอัด และอื่น ๆ) ได้โดยไม่ต้องดาวน์โหลด',
      },
      icon: 'icon.png',
      homepage_url: {
        ja: hp,
        en: hp,
        zh: hp,
        'zh-TW': hp,
        es: hp,
        'pt-BR': hp,
        th: hp,
      },
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
