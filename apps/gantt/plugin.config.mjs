// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'gantt';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 16801,
  },
  lint: {
    build: true,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.0.0',
      type: 'APP',
      name: {
        en: 'Gantt Chart Plugin',
        ja: 'ガントチャートプラグイン',
        zh: '甘特图插件',
        'zh-TW': '甘特圖插件',
        es: 'Plugin de gráfico de Gantt',
        'pt-BR': 'Plugin de gráfico de Gantt',
        th: 'ปลั๊กอินแผนภูมิแกนต์',
      },
      description: {
        en: 'Plugin to display a Gantt chart for project schedule management.',
        ja: 'ガントチャートを表示し、プロジェクトのスケジュール管理を支援するプラグインです。',
        zh: '显示甘特图，支持项目日程管理的插件。',
        'zh-TW': '顯示甘特圖，支持專案排程管理的插件。',
        es: 'Plugin para mostrar un diagrama de Gantt y ayudar en la gestión del cronograma del proyecto.',
        'pt-BR':
          'Plugin para exibir um gráfico de Gantt e auxiliar na gestão do cronograma do projeto.',
        th: 'ปลั๊กอินสำหรับแสดงแผนภูมิแกนต์และสนับสนุนการจัดการตารางเวลาของโครงการ',
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
