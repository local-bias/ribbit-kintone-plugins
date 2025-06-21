/**
 * 指定したIDのスタイル要素が存在しなければ、CSSデータをHTML上に読み込む
 * @param styleId - スタイル要素のID
 * @param cssData - 読み込むCSSデータ
 */
export function loadCssIfNotExists(styleId: string, cssData: string): void {
  // 指定したIDのスタイル要素が既に存在するかチェック
  if (document.getElementById(styleId)) {
    return; // 既に存在する場合は何もしない
  }

  // 新しいstyle要素を作成
  const styleElement = document.createElement('style');
  styleElement.id = styleId;

  // CSSデータを設定
  styleElement.appendChild(document.createTextNode(cssData));

  // headにstyle要素を追加
  document.head.appendChild(styleElement);
}

const myCss = `
:root {
  --🐸my-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
}

body {
  background-color: var(--🐸muted);
}

/* 基本となる背景色 */
#record-gaia {
  background-color: var(--🐸background);
  color: var(--🐸foreground);
}

.input-text-outer-cybozu .input-text-cybozu {
  color: var(--🐸foreground);
}

/* 基本となる背景色を使用 */
.showlayout-gaia,
.editablelayout-gaia,
.control-label-gaia,
.fm-canvas-gaia
.input-label-cybozu,
.subtable-row-label-gaia {
  background-color: transparent;
}

/* 詳細画面ではフォーム要素の枠を表示せず、背景もグレーアウトしない */
.showlayout-gaia .row-gaia .control-value-gaia {
  border: none;
  background-color: transparent;
  padding: 0;
  font-size: 16px;
  color: var(--🐸foreground);
}

.row-gaia {
  margin-left: 24px;
}

.control-label-gaia {
  color: color-mix(in oklab, var(--🐸foreground) 60%, transparent);
}

.control-gaia .input-text-cybozu, .control-gaia input[type=email], .control-gaia input[type=number], .control-gaia input[type=password], .control-gaia input[type=tel], .control-gaia input[type=text], .control-gaia input[type=url], .fm-control-gaia .input-text-cybozu, .fm-control-gaia input[type=email], .fm-control-gaia input[type=number], .fm-control-gaia input[type=password], .fm-control-gaia input[type=tel], .fm-control-gaia input[type=text], .fm-control-gaia input[type=url] {
  border-color: var(--🐸border);
  color: inherit;
}


/*--- フォームの入力欄のスタイル ---*/

.input-category-cybozu, .multipleselect-cybozu, .input-text-outer-cybozu.cybozu-ui-forms-editor-seamless .editor-cybozu, .ocean-ui-editor.ocean-ui-editor-seamless .ocean-ui-editor-field, .disabled-cybozu.input-text-outer-cybozu, .gaia-argoui-admin-app-flow-settings-changespace-searchbox-container .gaia-argoui-admin-app-flow-settings-changespace-searchbox-selected-name, .gaia-argoui-admin-app-flow-settings-changespace-searchbox-container input[type=text], .gaia-argoui-admin-app-flow-settings-templatedownload-templatedownloaddialog-templatedescription-textarea, .gaia-argoui-admin-app-flow-settings-templatedownload-templatedownloaddialog-templatename-input, .gaia-components-forms-input .gaia-components-forms-input-form, .gaia-components-forms-textarea .gaia-components-forms-textarea-form, .gaia-ui-appselect-keyword input[type=text], .gaia-ui-appselect-selected, .gaia-ui-fieldselect-combobox input[type=text], .gaia-ui-formmaker-control-setting-appselect-searchbox .gaia-ui-formmaker-control-setting-appselect-searchbox-input, .input-date-cybozu .input-date-text-cybozu, .input-datetime-cybozu .input-date-text-cybozu, .input-text-outer-cybozu .input-text-cybozu, .input-text-outer-cybozu .textarea-cybozu, .input-time-cybozu .input-time-text-cybozu, .ocean-ntf-filterconfig-place .goog-combobox input[type=text], .ocean-ntf-filterconfig-place .ocean-ntf-placesearchbox-outer .ocean-ntf-placesearchbox-selected-name, .ocean-ntf-filterconfig-place .ocean-ntf-placesearchbox-outer input[type=text], .ocean-ui-comments-linkpopup-input, .recordlist-edit-decimal-gaia .recordlist-forms-number-gaia, .recordlist-edit-link-gaia .recordlist-forms-text-gaia, .recordlist-edit-multiple_line_text-gaia .recordlist-forms-textarea-gaia, .recordlist-edit-single_line_text-gaia .recordlist-forms-text-gaia, .tr-dialog .modal-dialog-content #linkdialog-email-tab-input, .tr-dialog .modal-dialog-content #linkdialog-onweb-tab-input, .tr-dialog .modal-dialog-content #linkdialog-text {
  box-shadow: var(--🐸my-shadow);
  border-radius: calc(var(--🐸radius) - 4px);
}


.gaia-argoui-admin-app-flow-settings-changespace-searchbox-container [disabled].gaia-argoui-admin-app-flow-settings-changespace-searchbox-selected-name, .gaia-argoui-admin-app-flow-settings-changespace-searchbox-container input[disabled][type=text], .gaia-components-forms-input [disabled].gaia-components-forms-input-form, .gaia-components-forms-textarea [disabled].gaia-components-forms-textarea-form, .gaia-ui-appselect-keyword input[disabled][type=text], .gaia-ui-fieldselect-combobox input[disabled][type=text], .gaia-ui-formmaker-control-setting-appselect-searchbox [disabled].gaia-ui-formmaker-control-setting-appselect-searchbox-input, .input-date-cybozu [disabled].input-date-text-cybozu, .input-datetime-cybozu [disabled].input-date-text-cybozu, .input-text-outer-cybozu [disabled].input-text-cybozu, .input-text-outer-cybozu [disabled].textarea-cybozu, .input-time-cybozu [disabled].input-time-text-cybozu, .ocean-ntf-filterconfig-place .goog-combobox input[disabled][type=text], .ocean-ntf-filterconfig-place .ocean-ntf-placesearchbox-outer [disabled].ocean-ntf-placesearchbox-selected-name, .ocean-ntf-filterconfig-place .ocean-ntf-placesearchbox-outer input[disabled][type=text], .recordlist-edit-decimal-gaia [disabled].recordlist-forms-number-gaia, .recordlist-edit-link-gaia [disabled].recordlist-forms-text-gaia, .recordlist-edit-multiple_line_text-gaia [disabled].recordlist-forms-textarea-gaia, .recordlist-edit-single_line_text-gaia [disabled].recordlist-forms-text-gaia, .tr-dialog .modal-dialog-content [disabled]#linkdialog-email-tab-input, .tr-dialog .modal-dialog-content [disabled]#linkdialog-onweb-tab-input, .tr-dialog .modal-dialog-content [disabled]#linkdialog-text, [disabled].gaia-argoui-admin-app-flow-settings-templatedownload-templatedownloaddialog-templatedescription-textarea, [disabled].gaia-argoui-admin-app-flow-settings-templatedownload-templatedownloaddialog-templatename-input, [disabled].gaia-ui-appselect-selected, [disabled].ocean-ui-comments-linkpopup-input {
  background-color: var(--🐸muted);
  color: var(--🐸muted-foreground);
  border-color: var(--🐸border);
}

.gaia-argoui-select {
  box-shadow: var(--🐸my-shadow);
  color: var(--🐸foreground);
  background-color: transparent;
  border-radius: calc(var(--🐸radius) - 4px);

  :hover {
    background-color: var(--🐸muted);
  }
}
`;
loadCssIfNotExists('🐸my-theme', myCss);
