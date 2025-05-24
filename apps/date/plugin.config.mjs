// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'date';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 9365,
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
        en: 'Date Control Plugin',
        ja: '日付制御プラグイン',
        zh: '日期控制插件',
        'zh-TW': '日期控制插件',
        es: 'Plugin de Control de Fecha',
        'pt-BR': 'Plugin de Controle de Data',
        th: 'ปลั๊กอินควบคุมวันที่',
      },
      description: {
        en: 'Perform addition or subtraction from the current date or a specific date field and set the result to another field.',
        ja: '現在の日付、もしくは特定の日付フィールドから、加算・減算を行い、結果を別のフィールドに設定します。',
        zh: '从当前日期或特定日期字段执行加法或减法，并将结果设置到另一个字段。',
        'zh-TW': '從當前日期或特定日期欄位執行加法或減法，並將結果設置到另一個欄位。',
        es: 'Realiza una suma o resta de la fecha actual o de un campo de fecha específico y establece el resultado en otro campo.',
        'pt-BR':
          'Realiza adição ou subtração da data atual ou de um campo de data específico e define o resultado em outro campo.',
        th: 'ทำการบวกหรือลบจากวันที่ปัจจุบันหรือฟิลด์วันที่เฉพาะและตั้งค่าผลลัพธ์ไปยังฟิลด์อื่น',
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
