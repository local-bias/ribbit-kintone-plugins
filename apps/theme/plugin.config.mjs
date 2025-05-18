//@ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'theme';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 8241,
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
        en: 'Real-time Theme Change Plugin',
        ja: 'リアルタイムテーマ変更プラグイン',
        zh: '实时主题更改插件',
        'zh-TW': '即時主題更改插件',
        es: 'Plugin de cambio de tema en tiempo real',
        'pt-BR': 'Plugin de mudança de tema em tempo real',
        th: 'ปลั๊กอินเปลี่ยนธีมแบบเรียลไทม์',
      },
      description: {
        en: 'A plugin that allows you to change themes in real-time for a theme that requires checking while saving the settings of each app.',
        ja: '都度アプリの設定を保存しながら確認しなければならないテーマを、リアルタイムに変更できるようにするプラグインです。',
        zh: '一个插件，可以实时更改需要在保存每个应用程序的设置时进行检查的主题。',
        'zh-TW': '一個插件，可以實時更改需要在保存每個應用程序的設置時進行檢查的主題。',
        es: 'Un plugin que permite cambiar temas en tiempo real para un tema que requiere verificar mientras se guardan los ajustes de cada aplicación.',
        'pt-BR':
          'Um plugin que permite alterar temas em tempo real para um tema que requer verificação enquanto salva as configurações de cada aplicativo.',
        th: 'ปลั๊กอินที่ช่วยให้คุณเปลี่ยนธีมแบบเรียลไทม์สำหรับธีมที่ต้องตรวจสอบในขณะที่บันทึกการตั้งค่าของแต่ละแอป',
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
