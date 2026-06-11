// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'if';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 5832,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '0.1.0',
      type: 'APP',
      name: {
        en: 'if',
        ja: 'if',
        zh: 'if',
        'zh-TW': 'if',
        es: 'Proceso de ramificación condicional',
        'pt-BR': 'Processo de ramificação condicional',
        th: 'การประมวลผลแบบมีเงื่อนไข',
      },
      description: {
        en: 'Automatically fills field values and adds or removes table rows based on conditions.',
        ja: '条件に応じてフィールドへの自動入力やテーブルの行追加・行削除を行います。',
        zh: '根据条件自动填充字段值并添加或删除表格行。',
        'zh-TW': '根據條件自動填入欄位值並新增或刪除表格列。',
        es: 'Rellena campos y agrega o elimina filas de tabla según condiciones.',
        'pt-BR': 'Preenche campos e adiciona ou remove linhas de tabela com base em condições.',
        th: 'กรอกค่าฟิลด์และเพิ่มหรือลบแถวตารางตามเงื่อนไขโดยอัตโนมัติ',
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
