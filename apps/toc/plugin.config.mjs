//@ts-check
const hp = 'https://konomi.app/';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'toc';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 57590,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '2.0.0',
      type: 'APP',
      name: {
        en: 'Table of Contents Plugin',
        ja: '目次プラグイン',
        zh: '目录插件',
        'zh-TW': '目錄外掛程式',
        es: 'Plugin de tabla de contenidos',
        'pt-BR': 'Plugin de tabela de conteúdos',
        th: 'ปลั๊กอินสารบัญ',
      },
      description: {
        en: 'Add a table of contents to the record editing screen and enable scrolling to any section.',
        ja: 'レコード編集画面に目次を追加し、任意のセクションへスクロールできるようにします',
        zh: '在记录编辑界面添加目录，并实现可以滚动到任意部分。',
        'zh-TW': '在記錄編輯畫面添加目錄，並實現可以捲動到任意部分。',
        es: 'Agrega una tabla de contenidos a la pantalla de edición de registros y permite desplazarse a cualquier sección.',
        'pt-BR':
          'Adiciona uma tabela de conteúdos ao ecrã de edição de registos e permite deslocar-se para qualquer secção.',
        th: 'เพิ่มสารบัญลงในหน้าจอแก้ไขระเบียนและเปิดใช้งานการเลื่อนไปยังส่วนใดก็ได้',
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
