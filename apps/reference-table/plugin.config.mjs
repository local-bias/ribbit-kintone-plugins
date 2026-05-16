// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'reference-table';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 8624,
  },
  lint: {
    build: false,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.1.0',
      type: 'APP',
      name: {
        en: 'Reference Table Plugin',
        ja: '拡張関連レコードプラグイン',
        zh: '关联记录扩展插件',
        'zh-TW': '關聯記錄擴展插件',
        es: 'Plugin de extensión de tabla de referencia',
        'pt-BR': 'Plugin de extensão de tabela de referência',
        th: 'ปลั๊กอินขยายตารางอ้างอิง',
      },
      description: {
        en: 'Replaces and enhances related records with a searchable table, optional subtable expansion, and field aggregation.',
        ja: '既存の関連レコードフィールドを置き換え、検索・絞り込み・集計・任意のサブテーブル展開で関連レコード一覧を拡張するプラグインです。',
        zh: '用可搜索、可筛选、可汇总且可选展开子表的表格替代并增强关联记录。',
        'zh-TW': '以可搜尋、可篩選、可彙總且可選展開子表的表格取代並增強關聯記錄。',
        es: 'Sustituye y amplía los registros relacionados con búsqueda, filtros, agregaciones y subtables opcionales.',
        'pt-BR':
          'Substitui e amplia registros relacionados com busca, filtros, agregações e subtabelas opcionais.',
        th: 'แทนที่และขยายรายการระเบียนที่เกี่ยวข้องด้วยตารางที่ค้นหา กรอง สรุปค่า และขยายตารางย่อยได้ตามต้องการ',
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
