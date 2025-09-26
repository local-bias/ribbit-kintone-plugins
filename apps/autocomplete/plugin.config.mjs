// @ts-check
const hp = "https://konomi.app";
const cdn = "https://kintone-plugin.konomi.app";
const key = "autocomplete";

/** @satisfies { Plugin.Meta.Config } */
export default /** @type { const } */ ({
  id: `ribbit-kintone-plugin-${key}`,
  pluginReleasePageUrl: `https://ribbit.konomi.app/kintone-plugin/`,
  server: {
    port: 35327,
  },
  lint: {
    build: false,
  },
  tailwind: {
    css: "src/styles/global.css",
    config: {
      desktop: "tailwind.config.desktop.mjs",
      config: "tailwind.config.config.mjs",
    },
  },
  manifest: {
    base: {
      manifest_version: 1,
      version: "1.0.1",
      type: "APP",
      name: {
        en: "Input Assistance & Autocomplete Plugin",
        ja: "入力補助・自動補完プラグイン",
        zh: "输入辅助与自动补全插件",
        "zh-TW": "輸入輔助與自動完成外掛",
        es: "Complemento de asistencia de entrada y autocompletado",
        "pt-BR": "Plugin de assistência de entrada e preenchimento automático",
        th: "ปลั๊กอินช่วยกรอกและเติมข้อความอัตโนมัติ",
      },
      description: {
        en: "This plugin references specific apps and fields and displays selectable input suggestions as a list.",
        ja: "特定のアプリ、特定のフィールドを参照し、入力候補の一覧として表示・選択できるプラグインです。",
        zh: "该插件可引用指定的应用和字段，并以列表形式显示可选择的输入候选项。",
        "zh-TW":
          "此外掛可參照指定的應用與欄位，並以清單形式顯示可選擇的輸入建議。",
        es: "Este complemento hace referencia a aplicaciones y campos específicos y muestra una lista de sugerencias de entrada seleccionables.",
        "pt-BR":
          "Este plugin referencia aplicativos e campos específicos e exibe sugestões de entrada em uma lista para seleção.",
        th: "ปลั๊กอินนี้อ้างอิงแอปและฟิลด์ที่กำหนด และแสดงรายการคำแนะนำการกรอกให้เลือกได้",
      },
      icon: "icon.png",
      homepage_url: { ja: hp, en: hp },
      desktop: {
        js: [`${cdn}/common/desktop.js`],
        css: [`${cdn}/common/desktop.css`],
      },
      mobile: {
        js: [`${cdn}/common/desktop.js`],
        css: [`${cdn}/common/desktop.css`],
      },
      config: {
        html: "config.html",
        js: [`${cdn}/common/config.js`],
        css: [`${cdn}/common/config.css`],
        required_params: [],
      },
    },
    prod: {
      desktop: {
        js: [`${cdn}/${key}/desktop.js`],
        css: [`${cdn}/${key}/desktop.css`],
      },
      mobile: {
        js: [`${cdn}/${key}/desktop.js`],
        css: [`${cdn}/${key}/desktop.css`],
      },
      config: {
        js: [`${cdn}/${key}/config.js`],
        css: [`${cdn}/${key}/config.css`],
      },
    },
    standalone: {
      desktop: { js: ["desktop.js"], css: ["desktop.css"] },
      mobile: { js: ["desktop.js"], css: ["desktop.css"] },
      config: { js: ["config.js"], css: ["config.css"] },
    },
  },
});
