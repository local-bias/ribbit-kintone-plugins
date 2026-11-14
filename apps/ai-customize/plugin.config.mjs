// @ts-check
const hp = 'https://konomi.app';
const cdn = 'https://kintone-plugin.konomi.app';
const key = 'ai-customize';

/**
 * v1はモバイル画面を対象外とするため、`mobile`を登録しない
 * (実行しないコードを配布して初期化分岐に依存しない。docs/05-runtime.md 11章)
 *
 * @satisfies { Plugin.Meta.Config }
 */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 6329,
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: '1.0.0',
      type: 'APP',
      name: {
        en: 'AI Customize Plugin',
        ja: 'AIカスタマイズプラグイン',
        zh: 'AI 定制插件',
        'zh-TW': 'AI 客製化外掛程式',
        es: 'Complemento de personalización con IA',
        'pt-BR': 'Plugin de personalização com IA',
        th: 'ปลั๊กอินปรับแต่งด้วย AI',
        ms: 'Pemalam Penyesuaian AI',
      },
      description: {
        en: 'Manages JavaScript and CSS customizations in a kintone app and applies them to the current app, with per-customization permissions.',
        ja: 'kintoneアプリで管理するJavaScript・CSSのカスタマイズを、カスタマイズごとの権限つきでこのアプリに適用します',
        zh: '将在 kintone 应用中管理的 JavaScript 和 CSS 定制，按每个定制的权限应用到当前应用。',
        'zh-TW':
          '將在 kintone 應用程式中管理的 JavaScript 與 CSS 客製化，依各客製化的權限套用至目前的應用程式。',
        es: 'Aplica a esta aplicación las personalizaciones de JavaScript y CSS administradas en una aplicación de kintone, con permisos por personalización.',
        'pt-BR':
          'Aplica a este aplicativo as personalizações de JavaScript e CSS gerenciadas em um aplicativo kintone, com permissões por personalização.',
        th: 'นำการปรับแต่ง JavaScript และ CSS ที่จัดการในแอป kintone มาใช้กับแอปนี้ พร้อมสิทธิ์ของแต่ละการปรับแต่ง',
        ms: 'Menggunakan penyesuaian JavaScript dan CSS yang diurus dalam aplikasi kintone pada aplikasi ini, dengan kebenaran bagi setiap penyesuaian.',
      },
      icon: 'icon.png',
      homepage_url: { ja: hp, en: hp },
      desktop: { js: [`${cdn}/common/desktop.js`], css: [`${cdn}/common/desktop.css`] },
      config: {
        html: 'config.html',
        js: [`${cdn}/common/config.js`],
        css: [`${cdn}/common/config.css`],
        required_params: [],
      },
    },
    prod: {
      desktop: { js: [`${cdn}/${key}/desktop.js`], css: [`${cdn}/${key}/desktop.css`] },
      config: { js: [`${cdn}/${key}/config.js`], css: [`${cdn}/${key}/config.css`] },
    },
    standalone: {
      desktop: { js: ['desktop.js'], css: ['desktop.css'] },
      config: { js: ['config.js'], css: ['config.css'] },
    },
  },
});
