// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'image-converter';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 6828,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.0.0',
      type: 'APP',
      name: {
        en: 'Image Converter Plugin',
        ja: '画像変換プラグイン',
        zh: '图像转换插件',
        'zh-TW': '圖像轉換插件',
        es: 'Plugin de conversión de imágenes',
        'pt-BR': 'Plugin de conversão de imagem',
        th: 'ปลั๊กอินแปลงภาพ',
      },
      description: {
        en: 'This plugin converts image files to a specified format before uploading them to the file field.',
        ja: '画像ファイルを予め指定した形式に変換した上で、ファイルフィールドにアップロードします。',
        zh: '此插件在将图像文件上传到文件字段之前，将其转换为指定的格式。',
        'zh-TW': '此插件在將圖像文件上傳到文件欄位之前，將其轉換為指定的格式。',
        es: 'Este complemento convierte archivos de imagen a un formato específico antes de cargarlos en el campo de archivo.',
        'pt-BR':
          'Este plugin converte arquivos de imagem para um formato específico antes de carregá-los no campo de arquivo.',
        th: 'ปลั๊กอินนี้จะแปลงไฟล์ภาพเป็นรูปแบบที่กำหนดก่อนที่จะอัปโหลดไปยังฟิลด์ไฟล์',
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
