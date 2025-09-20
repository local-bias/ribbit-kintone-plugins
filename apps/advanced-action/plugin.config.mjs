// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'template';

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
      version: '0.1.0',
      type: 'APP',
      name: {
        en: 'Advanced Action (Copy Records Between Apps) Plugin',
        ja: '拡張アクション(アプリ間レコードコピー)プラグイン',
        zh: '扩展操作（跨应用记录复制）插件',
        'zh-TW': '擴充動作（跨應用程式複製紀錄）外掛程式',
        es: 'Acción avanzada: copiar registros entre apps',
        'pt-BR': 'Ação avançada: copiar registros entre apps',
        th: 'การดำเนินการขั้นสูง: คัดลอกระเบียนข้ามแอป',
      },
      description: {
        en: 'Copy records between apps with an Action-like button.',
        ja: 'レコードのコピー元、コピー先それぞれにプラグインを適用することで、標準機能のアクションボタンに近い操作感で、アプリ間のレコードコピーを実現するプラグインです。',
        zh: '类似动作按钮，在应用间复制记录。',
        'zh-TW': '類似動作按鈕，可在應用程式間複製紀錄。',
        es: 'Copia registros entre apps con un botón tipo Acción.',
        'pt-BR': 'Copie registros entre apps com um botão tipo Ação.',
        th: 'คัดลอกระเบียนข้ามแอป ด้วยปุ่มที่คล้าย Action',
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
