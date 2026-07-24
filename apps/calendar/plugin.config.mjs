//@ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'calendar';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 8487,
  },
  lint: {
    build: false,
  },
  tailwind: {
    css: 'src/styles/global.css',
    config: {
      desktop: 'tailwind.config.desktop.mjs',
      config: 'tailwind.config.config.mjs',
    },
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.2.1',
      type: 'APP',
      name: {
        en: 'calendar plugin',
        ja: 'カレンダープラグイン',
        zh: '日历插件',
        'zh-TW': '日曆插件',
        es: 'plugin de calendario',
        'pt-BR': 'plugin de calendário',
        th: 'ปลั๊กอินปฏิทิน',
      },
      description: {
        en: 'A calendar plugin that can be used as a scheduler using the open source library fullcalendar',
        ja: 'オープンソースライブラリであるfullcalendarを使用し、スケジューラーとして利用できるカレンダーを実装します',
        zh: '使用开源库fullcalendar，实现可用作调度程序的日历',
        'zh-TW': '使用開源庫fullcalendar，實現可用作調度程序的日曆',
        es: 'Un plugin de calendario que se puede utilizar como programador utilizando la biblioteca de código abierto fullcalendar',
        'pt-BR':
          'Um plugin de calendário que pode ser usado como um agendador usando a biblioteca de código aberto fullcalendar',
        th: 'ปลั๊กอินปฏิทินที่สามารถใช้เป็นตัวจัดกำหนดการโดยใช้ไลบรารีโอเพนซอร์ส fullcalendar',
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
