// @ts-check

const hp = 'https://konomi.app/';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'sort-subtable';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 11335,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.3.0',
      type: 'APP',
      name: {
        en: 'Sort Subtable Plugin',
        ja: 'サブテーブル並び替えプラグイン',
        zh: '子表排序插件',
        'zh-TW': '子表排序外掛程式',
        es: 'Complemento de ordenación de subtablas',
        'pt-BR': 'Plugin de ordenação de subtabela',
        th: 'ปลั๊กอินจัดเรียงตารางย่อย',
      },
      description: {
        en: 'Add a button to sort the rows of the subtable based on a specific column.',
        ja: 'サブテーブルの行を特定の列を基準にソートできるボタンを追加します。',
        zh: '在子表中添加一个按钮，根据特定列对行进行排序。',
        'zh-TW': '在子表中添加一個按鈕，根據特定列對行進行排序。',
        es: 'Agrega un botón para ordenar las filas de la subtabla según una columna específica.',
        'pt-BR':
          'Adiciona um botão para classificar as linhas da subtabela com base em uma coluna específica.',
        th: 'เพิ่มปุ่มเพื่อจัดเรียงแถวของตารางย่อยตามคอลัมน์เฉพาะ',
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
