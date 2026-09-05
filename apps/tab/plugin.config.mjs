// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'tab';

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 6327,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '3.1.0',
      type: 'APP',
      name: {
        en: 'Vertical Tab Plugin',
        ja: '垂直タブプラグイン',
        zh: '垂直标签插件',
        'zh-TW': '垂直分頁外掛程式',
        es: 'Complemento de pestañas verticales',
        'pt-BR': 'Plugin de guia vertical',
        th: 'ปลั๊กอินแท็บแนวตั้ง',
        ms: 'Pemalam Tab Menegak',
      },
      description: {
        en: 'Adds vertical tabs that follow the scroll to the record screen, and switches the fields shown for each tab.',
        ja: 'レコード画面にスクロールへ追従する垂直方向のタブを追加し、タブごとに表示するフィールドを切り替えます',
        zh: '在记录界面添加跟随滚动的垂直标签，并按标签切换显示的字段。',
        'zh-TW': '在記錄畫面新增跟隨捲動的垂直分頁，並依分頁切換顯示的欄位。',
        es: 'Agrega pestañas verticales que siguen el desplazamiento a la pantalla de registro y cambia los campos mostrados en cada pestaña.',
        'pt-BR':
          'Adiciona guias verticais que acompanham a rolagem à tela de registro e alterna os campos exibidos em cada guia.',
        th: 'เพิ่มแท็บแนวตั้งที่เลื่อนตามหน้าจอระเบียน และสลับฟิลด์ที่แสดงในแต่ละแท็บ',
        ms: 'Menambah tab menegak yang mengikut skrol pada skrin rekod, dan menukar medan yang dipaparkan bagi setiap tab.',
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
