// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'kanban';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 16802,
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
        en: 'Kanban Board Plugin',
        ja: 'カンバンボードプラグイン',
        zh: '看板插件',
        'zh-TW': '看板插件',
        es: 'Plugin de tablero Kanban',
        'pt-BR': 'Plugin de quadro Kanban',
        th: 'ปลั๊กอินกระดานคัมบัง',
      },
      description: {
        en: 'Plugin to display a Kanban board for task and workflow management.',
        ja: 'カンバンボードを表示し、タスクやワークフローの管理を支援するプラグインです。',
        zh: '显示看板，支持任务和工作流管理的插件。',
        'zh-TW': '顯示看板，支持任務和工作流程管理的插件。',
        es: 'Plugin para mostrar un tablero Kanban y ayudar en la gestión de tareas y flujos de trabajo.',
        'pt-BR':
          'Plugin para exibir um quadro Kanban e auxiliar na gestão de tarefas e fluxos de trabalho.',
        th: 'ปลั๊กอินสำหรับแสดงกระดานคัมบังและสนับสนุนการจัดการงานและเวิร์กโฟลว์',
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
