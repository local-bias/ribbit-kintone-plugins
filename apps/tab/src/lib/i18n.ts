import { commonUi, useTranslations } from '@repo/utils';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';

const ui = mergeDeep(commonUi, {
  ja: {
    'config.common.title': 'タブの幅',
    'config.common.description':
      'レコード画面に表示するタブの幅をpx単位で指定します。全てのタブに共通で適用されます。',
    'config.common.tabWidth.label': 'タブの幅(px)',
    'config.common.tabWidth.helper': '{0}〜{1}pxの範囲で指定してください(既定値: {2}px)',
    'config.common.bulkEdit.title': '一括編集',
    'config.common.bulkEdit.description':
      'アプリのフォームに配置されている要素を一覧し、それぞれをどのタブに表示するかをまとめて設定します。タブごとの詳細設定と同じ内容を、要素を起点として編集できます。',
    'config.common.bulkEdit.hint':
      'チェックを外した要素は、そのタブでは非表示になります。ここでの変更は、タブごとの詳細設定にもそのまま反映されます。',
    'config.common.bulkEdit.element': '要素',
    'config.common.bulkEdit.type.field': 'フィールド',
    'config.common.bulkEdit.type.group': 'グループ',
    'config.common.bulkEdit.type.space': 'スペース',
    'config.common.bulkEdit.type.label': 'ラベル',
    'config.common.bulkEdit.type.hr': '罫線',
    'config.common.bulkEdit.duplicated':
      '同じ文言のラベルがフォーム内に複数あります。これらは区別できないため、まとめて同じ設定が適用されます。',
    'config.common.bulkEdit.anonymousSpace':
      'スペース(要素IDが未設定のため、表示・非表示を切り替えられません)',
    'config.common.bulkEdit.anonymousLabel':
      'ラベル(要素IDが未設定で、かつ文言も空のため、表示・非表示を切り替えられません)',
    'config.common.bulkEdit.anonymousHr':
      '罫線(要素IDが未設定のため、個別に表示・非表示を切り替えられません)',
    'config.common.bulkEdit.anonymous':
      '要素IDが未設定のため、タブごとに切り替えられない要素が{0}件あります。アプリのフォーム設定で要素IDを設定すると、個別に割り当てられるようになります。非表示にしたはずの場所に余白が残る場合は、これらの要素が残っていないか確認してください。',
    'config.common.bulkEdit.unassigned':
      'どのタブにも割り当てられていない要素が{0}件あります。これらは全てのタブで非表示になります。',
    'config.common.bulkEdit.unassignedElement':
      'この要素はどのタブにも割り当てられていないため、全てのタブで非表示になります。',
    'config.common.bulkEdit.noTabs':
      'タブがありません。サイドバーの「+」ボタンからタブを追加してください。',
    'config.common.bulkEdit.noElements':
      'このアプリのフォームには、表示・非表示を切り替えられる要素がありません。',
    'config.common.bulkEdit.toggleColumn': '{0}に全ての要素を割り当てる',
    'config.common.bulkEdit.newElement.label': 'フォームに後から追加された要素の扱い',
    'config.common.bulkEdit.newElement.description':
      'この設定を保存した後にアプリへ追加されたフィールドなどを、既存のタブでどう扱うかを選びます。',
    'config.common.bulkEdit.newElement.show': '全てのタブで表示する',
    'config.common.bulkEdit.newElement.hide': '全てのタブで非表示にする',
    'config.condition.tab.title': 'タブ情報',
    'config.condition.tab.description':
      'レコード登録画面・詳細画面に表示する、タブの名称を設定します。',
    'config.condition.tab.label': 'タブ名',
    'config.condition.fields.title': 'フィールドの設定',
    'config.condition.fields.description':
      'このタブを選択したときに、表示・非表示を切り替えるフィールドを設定します。',
    'config.condition.fields.mode.add': '指定したフィールドだけ表示',
    'config.condition.fields.mode.sub': '指定したフィールドを非表示',
    'config.condition.fields.label.add': '表示するフィールド',
    'config.condition.fields.label.sub': '表示しないフィールド',
    'config.condition.fields.placeholder': 'フィールドを検索',
    'config.condition.groups.title': 'グループフィールドの設定',
    'config.condition.groups.description':
      'このタブを選択したときに、表示・非表示を切り替えるグループを設定します。',
    'config.condition.groups.caution':
      '表示に設定しても、グループに所属するフィールドは影響を受けません。グループ内のフィールドを表示したい場合は、「フィールドの設定」からフィールドを指定する必要があります。',
    'config.condition.groups.mode.add': '指定したグループだけ表示',
    'config.condition.groups.mode.sub': '指定したグループを非表示',
    'config.condition.groups.label.add': '表示するグループ',
    'config.condition.groups.label.sub': '表示しないグループ',
    'config.condition.groups.placeholder': 'グループフィールドを検索',
    'config.condition.groups.empty': 'グループフィールドが見つかりません',
    'config.condition.spaces.title': 'スペースフィールドの設定',
    'config.condition.spaces.description':
      'このタブを選択したときに、表示・非表示を切り替えるスペースを設定します。要素IDが設定されているスペースのみ選択できます。',
    'config.condition.spaces.mode.add': '指定したスペースだけ表示',
    'config.condition.spaces.mode.sub': '指定したスペースを非表示',
    'config.condition.spaces.label.add': '表示するスペース',
    'config.condition.spaces.label.sub': '表示しないスペース',
    'config.condition.spaces.placeholder': 'スペースの要素IDを検索',
    'config.condition.spaces.empty': '要素IDが設定されたスペースフィールドが見つかりません',
    'config.condition.labels.title': 'ラベルフィールドの設定',
    'config.condition.labels.description':
      'このタブを選択したときに、表示・非表示を切り替えるラベルを設定します。',
    'config.condition.labels.caution':
      '要素IDが未設定のラベルは文言で識別するため、ラベルの文言を変更すると表示・非表示の設定から外れてしまいます。アプリのフォーム設定でラベルに要素IDを設定すると、文言の変更に影響されなくなり、文言が空のラベルも切り替えられるようになります。',
    'config.condition.labels.mode.add': '指定したラベルだけ表示',
    'config.condition.labels.mode.sub': '指定したラベルを非表示',
    'config.condition.labels.label.add': '表示するラベル',
    'config.condition.labels.label.sub': '表示しないラベル',
    'config.condition.labels.placeholder': 'ラベルの要素ID・文言を検索',
    'config.condition.labels.empty': 'ラベルフィールドが見つかりません',
    'config.condition.hr.title': '罫線の設定',
    'config.condition.hr.description':
      'このタブを選択したときに、表示・非表示を切り替える罫線を設定します。要素IDが設定されている罫線のみ、個別に選択できます。',
    'config.condition.hr.hint':
      '要素IDが未設定の罫線は個別に選択できないため、「指定した罫線だけ表示」を選ぶと全て非表示に、「指定した罫線を非表示」を選ぶと全て表示になります。',
    'config.condition.hr.mode.add': '指定した罫線だけ表示',
    'config.condition.hr.mode.sub': '指定した罫線を非表示',
    'config.condition.hr.label.add': '表示する罫線',
    'config.condition.hr.label.sub': '表示しない罫線',
    'config.condition.hr.placeholder': '罫線の要素IDを検索',
    'config.condition.hr.empty': '要素IDが設定された罫線が見つかりません',
    'config.error.formLoadFailure': '情報の取得に失敗しました: {0}',
    'config.common.remembersSelectedTab.title': 'タブの選択状態',
    'config.common.remembersSelectedTab.description':
      '最後に選択していたタブを記憶し、次に同じアプリのレコードを開いたときに復元します。URLに`?tab=タブ名`(または`?tab=1`のような番号)を付けると、そのタブを開いた状態でリンクを共有できます。',
    'config.common.remembersSelectedTab.label': '選択していたタブを記憶する',
    'config.common.notifiesMissingRequiredFields.title': '未入力の必須フィールドの通知',
    'config.common.notifiesMissingRequiredFields.description':
      '非表示のフィールドもkintoneの必須チェックの対象になるため、未入力のまま保存しようとすると原因の見えないエラーになります。有効にすると、該当するタブに印を付け、保存時にそのタブへ自動で切り替えます。',
    'config.common.notifiesMissingRequiredFields.label': '未入力の必須フィールドをタブに表示する',
    'config.common.collapsesEmptyRows.title': '空になった行の余白',
    'config.common.collapsesEmptyRows.description':
      'kintoneは行内の要素を全て非表示にしても行そのものを残すため、非表示にした分の余白が残ることがあります。有効にすると、表示できる要素が1つも無くなった行を行ごと畳みます。',
    'config.common.collapsesEmptyRows.label': '空になった行を畳む',
    'config.condition.screens.title': 'タブを表示する画面',
    'config.condition.screens.description':
      'このタブを表示する画面を選択します。1つも選択していない場合、このタブはどの画面にも表示されません。',
    'config.condition.screens.empty': 'このままでは、このタブはどの画面にも表示されません。',
    'config.condition.screens.create': 'レコード追加画面',
    'config.condition.screens.edit': 'レコード編集画面',
    'config.condition.screens.detail': 'レコード詳細画面',
    'config.condition.displayConditions.title': 'レコードの値による表示条件',
    'config.condition.displayConditions.description':
      'レコードの値が条件を満たすときだけ、このタブを表示します。条件を1つも設定しない場合は、常に表示します。',
    'config.condition.displayConditions.logic': '条件の結合方法',
    'config.condition.displayConditions.logic.and': 'すべての条件を満たす(AND)',
    'config.condition.displayConditions.logic.or': 'いずれかの条件を満たす(OR)',
    'config.condition.displayConditions.add': '条件を追加する',
    'config.condition.displayConditions.delete': 'この条件を削除する',
    'config.condition.viewers.title': '閲覧者による表示条件',
    'config.condition.viewers.description':
      '指定したユーザー・グループ・組織のいずれかに該当する場合だけ、このタブを表示します。すべて空の場合は全員に表示します。',
    'config.condition.viewers.caution':
      'これは表示の切り替えであり、アクセス制御ではありません。非表示にしたフィールドの値もブラウザからは取得できるため、権限の制御にはkintoneのアクセス権を使用してください。',
    'config.condition.viewers.users': '対象のユーザー',
    'config.condition.viewers.groups': '対象のグループ',
    'config.condition.viewers.organizations': '対象の組織',
    'config.condition.statuses.title': 'ステータスによる表示条件',
    'config.condition.statuses.description':
      'プロセス管理の指定したステータスのときだけ、このタブを表示します。空の場合はすべてのステータスで表示します。',
    'config.condition.statuses.label': '対象のステータス',
    'config.condition.statuses.disabled': 'このアプリではプロセス管理が有効になっていません。',
    'desktop.tab.missingRequired': '未入力の必須フィールドがあります',
    'desktop.error.rootNotFound': 'タブを描画する対象の要素が取得できませんでした',
  },
  en: {
    'config.common.title': 'Tab width',
    'config.common.description':
      'Sets the width of the tabs shown on the record screen, in pixels. It applies to every tab.',
    'config.common.tabWidth.label': 'Tab width (px)',
    'config.common.tabWidth.helper': 'Enter a value between {0} and {1} px (default: {2} px)',
    'config.common.bulkEdit.title': 'Bulk edit',
    'config.common.bulkEdit.description':
      'Lists every element placed on the app form so you can assign each one to the tabs that should show it. This edits the same settings as the per-tab configuration, but element by element.',
    'config.common.bulkEdit.hint':
      'Clearing a checkbox hides that element on the tab. Changes made here are reflected in the per-tab settings as well.',
    'config.common.bulkEdit.element': 'Element',
    'config.common.bulkEdit.type.field': 'Field',
    'config.common.bulkEdit.type.group': 'Group',
    'config.common.bulkEdit.type.space': 'Space',
    'config.common.bulkEdit.type.label': 'Label',
    'config.common.bulkEdit.type.hr': 'Horizontal rule',
    'config.common.bulkEdit.duplicated':
      'The form contains several labels with the same text. They cannot be told apart, so the same setting applies to all of them.',
    'config.common.bulkEdit.anonymousSpace':
      'Space (no element ID is set, so it cannot be shown or hidden)',
    'config.common.bulkEdit.anonymousLabel':
      'Label (no element ID and no text, so it cannot be shown or hidden)',
    'config.common.bulkEdit.anonymousHr':
      'Horizontal rule (no element ID is set, so it cannot be switched individually)',
    'config.common.bulkEdit.anonymous':
      '{0} element(s) have no element ID and cannot be assigned per tab. Set an element ID in the app form settings to assign them individually. If blank space remains where you expected elements to be hidden, check whether these elements are still visible.',
    'config.common.bulkEdit.unassigned':
      '{0} element(s) are not assigned to any tab. They will be hidden on every tab.',
    'config.common.bulkEdit.unassignedElement':
      'This element is not assigned to any tab, so it is hidden on every tab',
    'config.common.bulkEdit.noTabs':
      'There are no tabs yet. Add one with the "+" button in the sidebar.',
    'config.common.bulkEdit.noElements':
      'This app form has no elements that can be shown or hidden.',
    'config.common.bulkEdit.toggleColumn': 'Assign every element to {0}',
    'config.common.bulkEdit.newElement.label': 'Elements added to the form later',
    'config.common.bulkEdit.newElement.description':
      'Choose how existing tabs treat fields and other elements added to the app after this configuration is saved.',
    'config.common.bulkEdit.newElement.show': 'Show on every tab',
    'config.common.bulkEdit.newElement.hide': 'Hide on every tab',
    'config.condition.tab.title': 'Tab',
    'config.condition.tab.description':
      'Sets the name of the tab displayed on the record create and detail screens.',
    'config.condition.tab.label': 'Tab name',
    'config.condition.fields.title': 'Fields',
    'config.condition.fields.description':
      'Sets the fields to show or hide while this tab is selected.',
    'config.condition.fields.mode.add': 'Show only the selected fields',
    'config.condition.fields.mode.sub': 'Hide the selected fields',
    'config.condition.fields.label.add': 'Fields to show',
    'config.condition.fields.label.sub': 'Fields to hide',
    'config.condition.fields.placeholder': 'Search fields',
    'config.condition.groups.title': 'Group fields',
    'config.condition.groups.description':
      'Sets the groups to show or hide while this tab is selected.',
    'config.condition.groups.caution':
      'Showing a group does not affect the fields inside it. To show fields inside a group, specify them under "Fields".',
    'config.condition.groups.mode.add': 'Show only the selected groups',
    'config.condition.groups.mode.sub': 'Hide the selected groups',
    'config.condition.groups.label.add': 'Groups to show',
    'config.condition.groups.label.sub': 'Groups to hide',
    'config.condition.groups.placeholder': 'Search group fields',
    'config.condition.groups.empty': 'No group fields found',
    'config.condition.spaces.title': 'Space fields',
    'config.condition.spaces.description':
      'Sets the spaces to show or hide while this tab is selected. Only spaces with an element ID can be selected.',
    'config.condition.spaces.mode.add': 'Show only the selected spaces',
    'config.condition.spaces.mode.sub': 'Hide the selected spaces',
    'config.condition.spaces.label.add': 'Spaces to show',
    'config.condition.spaces.label.sub': 'Spaces to hide',
    'config.condition.spaces.placeholder': 'Search space element IDs',
    'config.condition.spaces.empty': 'No space fields with an element ID were found',
    'config.condition.labels.title': 'Label fields',
    'config.condition.labels.description':
      'Sets the labels to show or hide while this tab is selected.',
    'config.condition.labels.caution':
      'Labels without an element ID are identified by their text, so changing the text removes them from this setting. Setting an element ID in the app form settings makes them immune to text changes and also allows labels with no text to be switched.',
    'config.condition.labels.mode.add': 'Show only the selected labels',
    'config.condition.labels.mode.sub': 'Hide the selected labels',
    'config.condition.labels.label.add': 'Labels to show',
    'config.condition.labels.label.sub': 'Labels to hide',
    'config.condition.labels.placeholder': 'Search label element IDs and texts',
    'config.condition.labels.empty': 'No label fields found',
    'config.condition.hr.title': 'Horizontal rules',
    'config.condition.hr.description':
      'Sets the horizontal rules to show or hide while this tab is selected. Only rules with an element ID can be selected individually.',
    'config.condition.hr.hint':
      'Rules without an element ID cannot be selected individually: "Show only the selected rules" hides all of them, and "Hide the selected rules" shows all of them.',
    'config.condition.hr.mode.add': 'Show only the selected rules',
    'config.condition.hr.mode.sub': 'Hide the selected rules',
    'config.condition.hr.label.add': 'Rules to show',
    'config.condition.hr.label.sub': 'Rules to hide',
    'config.condition.hr.placeholder': 'Search rule element IDs',
    'config.condition.hr.empty': 'No horizontal rules with an element ID were found',
    'config.error.formLoadFailure': 'Failed to load information: {0}',
    'config.common.remembersSelectedTab.title': 'Selected tab',
    'config.common.remembersSelectedTab.description':
      'Remembers the last selected tab and restores it the next time a record of the same app is opened. Adding `?tab=<tab name>` (or a number such as `?tab=1`) to the URL opens that tab directly.',
    'config.common.remembersSelectedTab.label': 'Remember the selected tab',
    'config.common.notifiesMissingRequiredFields.title': 'Empty required fields',
    'config.common.notifiesMissingRequiredFields.description':
      'kintone validates required fields even when they are hidden, so saving with an empty one fails without a visible cause. When enabled, tabs containing such fields are marked and the plugin switches to that tab on save.',
    'config.common.notifiesMissingRequiredFields.label': 'Mark tabs with empty required fields',
    'config.common.collapsesEmptyRows.title': 'Blank space left by empty rows',
    'config.common.collapsesEmptyRows.description':
      'kintone keeps a row even when every element inside it is hidden, which can leave blank space behind. When enabled, rows with no visible elements are collapsed.',
    'config.common.collapsesEmptyRows.label': 'Collapse rows that became empty',
    'config.condition.screens.title': 'Screens',
    'config.condition.screens.description':
      'Selects the screens this tab is shown on. If none are selected, the tab is not shown anywhere.',
    'config.condition.screens.empty':
      'With no screen selected, this tab will not be shown anywhere.',
    'config.condition.screens.create': 'Record create screen',
    'config.condition.screens.edit': 'Record edit screen',
    'config.condition.screens.detail': 'Record detail screen',
    'config.condition.displayConditions.title': 'Conditions on record values',
    'config.condition.displayConditions.description':
      'Shows this tab only while the record values match. With no condition set, the tab is always shown.',
    'config.condition.displayConditions.logic': 'How to combine conditions',
    'config.condition.displayConditions.logic.and': 'Match all conditions (AND)',
    'config.condition.displayConditions.logic.or': 'Match any condition (OR)',
    'config.condition.displayConditions.add': 'Add a condition',
    'config.condition.displayConditions.delete': 'Remove this condition',
    'config.condition.viewers.title': 'Conditions on the viewer',
    'config.condition.viewers.description':
      'Shows this tab only to the specified users, groups or organizations. If all are empty, the tab is shown to everyone.',
    'config.condition.viewers.caution':
      'This only switches what is displayed; it is not access control. Values of hidden fields are still retrievable from the browser, so use kintone permissions to restrict access.',
    'config.condition.viewers.users': 'Users',
    'config.condition.viewers.groups': 'Groups',
    'config.condition.viewers.organizations': 'Organizations',
    'config.condition.statuses.title': 'Conditions on the process status',
    'config.condition.statuses.description':
      'Shows this tab only while the process management status matches. If empty, the tab is shown for every status.',
    'config.condition.statuses.label': 'Statuses',
    'config.condition.statuses.disabled': 'Process management is not enabled for this app.',
    'desktop.tab.missingRequired': 'Contains an empty required field',
    'desktop.error.rootNotFound': 'Could not find the element to render the tabs into',
  },
  es: {
    'config.common.title': 'Ancho de las pestañas',
    'config.common.description':
      'Define el ancho en píxeles de las pestañas mostradas en la pantalla del registro. Se aplica a todas las pestañas.',
    'config.common.tabWidth.label': 'Ancho de las pestañas (px)',
    'config.common.tabWidth.helper':
      'Introduzca un valor entre {0} y {1} px (predeterminado: {2} px)',
    'config.common.bulkEdit.title': 'Edición masiva',
    'config.common.bulkEdit.description':
      'Muestra todos los elementos colocados en el formulario de la aplicación para asignar cada uno a las pestañas que deben mostrarlo. Edita la misma configuración que los ajustes por pestaña, pero elemento por elemento.',
    'config.common.bulkEdit.hint':
      'Al desmarcar una casilla, el elemento se oculta en esa pestaña. Los cambios realizados aquí también se reflejan en los ajustes por pestaña.',
    'config.common.bulkEdit.element': 'Elemento',
    'config.common.bulkEdit.type.field': 'Campo',
    'config.common.bulkEdit.type.group': 'Grupo',
    'config.common.bulkEdit.type.space': 'Espacio',
    'config.common.bulkEdit.type.label': 'Etiqueta',
    'config.common.bulkEdit.type.hr': 'Línea divisoria',
    'config.common.bulkEdit.duplicated':
      'El formulario contiene varias etiquetas con el mismo texto. No se pueden distinguir, por lo que se les aplica la misma configuración.',
    'config.common.bulkEdit.anonymousSpace':
      'Espacio (no tiene ID de elemento, por lo que no se puede mostrar ni ocultar)',
    'config.common.bulkEdit.anonymousLabel':
      'Etiqueta (no tiene ID de elemento ni texto, por lo que no se puede mostrar ni ocultar)',
    'config.common.bulkEdit.anonymousHr':
      'Línea divisoria (no tiene ID de elemento, por lo que no se puede cambiar individualmente)',
    'config.common.bulkEdit.anonymous':
      'Hay {0} elemento(s) sin ID de elemento que no se pueden asignar por pestaña. Defina un ID de elemento en los ajustes del formulario para asignarlos individualmente. Si queda un espacio en blanco donde esperaba ocultar elementos, compruebe si estos elementos siguen visibles.',
    'config.common.bulkEdit.unassigned':
      'Hay {0} elemento(s) sin asignar a ninguna pestaña. Se ocultarán en todas las pestañas.',
    'config.common.bulkEdit.unassignedElement':
      'Este elemento no está asignado a ninguna pestaña, por lo que se oculta en todas.',
    'config.common.bulkEdit.noTabs':
      'Todavía no hay pestañas. Añada una con el botón «+» de la barra lateral.',
    'config.common.bulkEdit.noElements':
      'El formulario de esta aplicación no tiene elementos que se puedan mostrar u ocultar.',
    'config.common.bulkEdit.toggleColumn': 'Asignar todos los elementos a {0}',
    'config.common.bulkEdit.newElement.label': 'Elementos añadidos al formulario más adelante',
    'config.common.bulkEdit.newElement.description':
      'Elija cómo tratan las pestañas existentes los campos y otros elementos añadidos a la aplicación después de guardar esta configuración.',
    'config.common.bulkEdit.newElement.show': 'Mostrar en todas las pestañas',
    'config.common.bulkEdit.newElement.hide': 'Ocultar en todas las pestañas',
    'config.condition.tab.title': 'Pestaña',
    'config.condition.tab.description':
      'Define el nombre de la pestaña que se muestra en las pantallas de creación y detalle del registro.',
    'config.condition.tab.label': 'Nombre de la pestaña',
    'config.condition.fields.title': 'Campos',
    'config.condition.fields.description':
      'Define los campos que se muestran u ocultan mientras esta pestaña está seleccionada.',
    'config.condition.fields.mode.add': 'Mostrar solo los campos seleccionados',
    'config.condition.fields.mode.sub': 'Ocultar los campos seleccionados',
    'config.condition.fields.label.add': 'Campos a mostrar',
    'config.condition.fields.label.sub': 'Campos a ocultar',
    'config.condition.fields.placeholder': 'Buscar campos',
    'config.condition.groups.title': 'Campos de grupo',
    'config.condition.groups.description':
      'Define los grupos que se muestran u ocultan mientras esta pestaña está seleccionada.',
    'config.condition.groups.caution':
      'Mostrar un grupo no afecta a los campos que contiene. Para mostrar los campos de un grupo, especifíquelos en «Campos».',
    'config.condition.groups.mode.add': 'Mostrar solo los grupos seleccionados',
    'config.condition.groups.mode.sub': 'Ocultar los grupos seleccionados',
    'config.condition.groups.label.add': 'Grupos a mostrar',
    'config.condition.groups.label.sub': 'Grupos a ocultar',
    'config.condition.groups.placeholder': 'Buscar campos de grupo',
    'config.condition.groups.empty': 'No se encontraron campos de grupo',
    'config.condition.spaces.title': 'Campos de espacio',
    'config.condition.spaces.description':
      'Define los espacios que se muestran u ocultan mientras esta pestaña está seleccionada. Solo pueden seleccionarse los espacios con un ID de elemento.',
    'config.condition.spaces.mode.add': 'Mostrar solo los espacios seleccionados',
    'config.condition.spaces.mode.sub': 'Ocultar los espacios seleccionados',
    'config.condition.spaces.label.add': 'Espacios a mostrar',
    'config.condition.spaces.label.sub': 'Espacios a ocultar',
    'config.condition.spaces.placeholder': 'Buscar ID de elemento del espacio',
    'config.condition.spaces.empty': 'No se encontraron campos de espacio con ID de elemento',
    'config.condition.labels.title': 'Campos de etiqueta',
    'config.condition.labels.description':
      'Define las etiquetas que se muestran u ocultan mientras esta pestaña está seleccionada.',
    'config.condition.labels.caution':
      'Las etiquetas sin ID de elemento se identifican por su texto, por lo que cambiar el texto las excluye de esta configuración. Si define un ID de elemento en los ajustes del formulario, dejan de depender del texto y también pueden cambiarse las etiquetas sin texto.',
    'config.condition.labels.mode.add': 'Mostrar solo las etiquetas seleccionadas',
    'config.condition.labels.mode.sub': 'Ocultar las etiquetas seleccionadas',
    'config.condition.labels.label.add': 'Etiquetas a mostrar',
    'config.condition.labels.label.sub': 'Etiquetas a ocultar',
    'config.condition.labels.placeholder': 'Buscar ID de elemento o texto de etiqueta',
    'config.condition.labels.empty': 'No se encontraron campos de etiqueta',
    'config.condition.hr.title': 'Líneas divisorias',
    'config.condition.hr.description':
      'Define las líneas divisorias que se muestran u ocultan mientras esta pestaña está seleccionada. Solo se pueden seleccionar individualmente las líneas con ID de elemento.',
    'config.condition.hr.hint':
      'Las líneas sin ID de elemento no se pueden seleccionar individualmente: «Mostrar solo las líneas seleccionadas» las oculta todas y «Ocultar las líneas seleccionadas» las muestra todas.',
    'config.condition.hr.mode.add': 'Mostrar solo las líneas seleccionadas',
    'config.condition.hr.mode.sub': 'Ocultar las líneas seleccionadas',
    'config.condition.hr.label.add': 'Líneas a mostrar',
    'config.condition.hr.label.sub': 'Líneas a ocultar',
    'config.condition.hr.placeholder': 'Buscar ID de elemento de la línea',
    'config.condition.hr.empty': 'No se encontraron líneas divisorias con ID de elemento',
    'config.error.formLoadFailure': 'Error al obtener la información: {0}',
    'config.common.remembersSelectedTab.title': 'Pestaña seleccionada',
    'config.common.remembersSelectedTab.description':
      'Recuerda la última pestaña seleccionada y la restaura la próxima vez que se abra un registro de la misma aplicación. Añadir `?tab=<nombre>` (o un número como `?tab=1`) a la URL abre esa pestaña directamente.',
    'config.common.remembersSelectedTab.label': 'Recordar la pestaña seleccionada',
    'config.common.notifiesMissingRequiredFields.title': 'Campos obligatorios vacíos',
    'config.common.notifiesMissingRequiredFields.description':
      'kintone valida los campos obligatorios aunque estén ocultos, por lo que guardar con uno vacío falla sin causa visible. Al activarlo, se marcan las pestañas que los contienen y se cambia a esa pestaña al guardar.',
    'config.common.notifiesMissingRequiredFields.label':
      'Marcar las pestañas con campos obligatorios vacíos',
    'config.common.collapsesEmptyRows.title': 'Espacio en blanco de las filas vacías',
    'config.common.collapsesEmptyRows.description':
      'kintone conserva la fila aunque se oculten todos los elementos que contiene, por lo que puede quedar espacio en blanco. Al activarlo, las filas sin elementos visibles se contraen.',
    'config.common.collapsesEmptyRows.label': 'Contraer las filas que quedan vacías',
    'config.condition.screens.title': 'Pantallas',
    'config.condition.screens.description':
      'Selecciona las pantallas en las que se muestra esta pestaña. Si no se selecciona ninguna, la pestaña no se muestra en ningún sitio.',
    'config.condition.screens.empty':
      'Sin ninguna pantalla seleccionada, esta pestaña no se mostrará en ningún sitio.',
    'config.condition.screens.create': 'Pantalla de creación de registro',
    'config.condition.screens.edit': 'Pantalla de edición de registro',
    'config.condition.screens.detail': 'Pantalla de detalle de registro',
    'config.condition.displayConditions.title': 'Condiciones sobre los valores del registro',
    'config.condition.displayConditions.description':
      'Muestra esta pestaña solo cuando los valores del registro cumplen las condiciones. Sin condiciones, se muestra siempre.',
    'config.condition.displayConditions.logic': 'Cómo combinar las condiciones',
    'config.condition.displayConditions.logic.and': 'Cumplir todas las condiciones (AND)',
    'config.condition.displayConditions.logic.or': 'Cumplir alguna condición (OR)',
    'config.condition.displayConditions.add': 'Añadir una condición',
    'config.condition.displayConditions.delete': 'Eliminar esta condición',
    'config.condition.viewers.title': 'Condiciones sobre el usuario',
    'config.condition.viewers.description':
      'Muestra esta pestaña solo a los usuarios, grupos u organizaciones indicados. Si todo está vacío, se muestra a todos.',
    'config.condition.viewers.caution':
      'Esto solo cambia lo que se muestra; no es un control de acceso. Los valores de los campos ocultos siguen siendo accesibles desde el navegador, use los permisos de kintone para restringir el acceso.',
    'config.condition.viewers.users': 'Usuarios',
    'config.condition.viewers.groups': 'Grupos',
    'config.condition.viewers.organizations': 'Organizaciones',
    'config.condition.statuses.title': 'Condiciones sobre el estado del proceso',
    'config.condition.statuses.description':
      'Muestra esta pestaña solo cuando el estado de la gestión de procesos coincide. Si está vacío, se muestra en todos los estados.',
    'config.condition.statuses.label': 'Estados',
    'config.condition.statuses.disabled':
      'La gestión de procesos no está habilitada en esta aplicación.',
    'desktop.tab.missingRequired': 'Contiene un campo obligatorio vacío',
    'desktop.error.rootNotFound': 'No se encontró el elemento donde renderizar las pestañas',
  },
  zh: {
    'config.common.title': '标签宽度',
    'config.common.description': '以px为单位指定记录界面中标签的宽度。该设置对所有标签生效。',
    'config.common.tabWidth.label': '标签宽度（px）',
    'config.common.tabWidth.helper': '请在{0}〜{1}px的范围内指定（默认值：{2}px）',
    'config.common.bulkEdit.title': '批量编辑',
    'config.common.bulkEdit.description':
      '列出应用表单上的所有元素，可以统一设置每个元素显示在哪些标签中。与各标签的详细设置编辑的是同一份配置，只是以元素为起点。',
    'config.common.bulkEdit.hint':
      '取消勾选的元素在该标签中将被隐藏。此处的更改同样会反映到各标签的详细设置中。',
    'config.common.bulkEdit.element': '元素',
    'config.common.bulkEdit.type.field': '字段',
    'config.common.bulkEdit.type.group': '分组',
    'config.common.bulkEdit.type.space': '空白',
    'config.common.bulkEdit.type.label': '标签',
    'config.common.bulkEdit.type.hr': '分隔线',
    'config.common.bulkEdit.duplicated':
      '表单中存在多个文字相同的标签字段。它们无法区分，因此会应用相同的设置。',
    'config.common.bulkEdit.anonymousSpace': '空白字段（未设置元素ID，无法切换显示与隐藏）',
    'config.common.bulkEdit.anonymousLabel':
      '标签字段（未设置元素ID且文字为空，无法切换显示与隐藏）',
    'config.common.bulkEdit.anonymousHr': '分隔线（未设置元素ID，无法单独切换显示与隐藏）',
    'config.common.bulkEdit.anonymous':
      '有{0}个元素因未设置元素ID而无法按标签分配。在应用的表单设置中设置元素ID后，即可单独分配。如果本应隐藏的位置仍留有空白，请确认这些元素是否仍然显示。',
    'config.common.bulkEdit.unassigned':
      '有{0}个元素未分配到任何标签，它们在所有标签中都将被隐藏。',
    'config.common.bulkEdit.unassignedElement':
      '该元素未分配到任何标签，因此在所有标签中都会被隐藏。',
    'config.common.bulkEdit.noTabs': '尚未添加标签。请通过侧边栏的“+”按钮添加。',
    'config.common.bulkEdit.noElements': '该应用的表单中没有可切换显示与隐藏的元素。',
    'config.common.bulkEdit.toggleColumn': '将所有元素分配到{0}',
    'config.common.bulkEdit.newElement.label': '之后添加到表单的元素的处理方式',
    'config.common.bulkEdit.newElement.description':
      '选择保存此设置后新添加到应用的字段等，在现有标签中如何处理。',
    'config.common.bulkEdit.newElement.show': '在所有标签中显示',
    'config.common.bulkEdit.newElement.hide': '在所有标签中隐藏',
    'config.condition.tab.title': '标签信息',
    'config.condition.tab.description': '设置在记录添加界面和详情界面中显示的标签名称。',
    'config.condition.tab.label': '标签名称',
    'config.condition.fields.title': '字段设置',
    'config.condition.fields.description': '设置选中此标签时要显示或隐藏的字段。',
    'config.condition.fields.mode.add': '仅显示指定的字段',
    'config.condition.fields.mode.sub': '隐藏指定的字段',
    'config.condition.fields.label.add': '要显示的字段',
    'config.condition.fields.label.sub': '要隐藏的字段',
    'config.condition.fields.placeholder': '搜索字段',
    'config.condition.groups.title': '分组字段设置',
    'config.condition.groups.description': '设置选中此标签时要显示或隐藏的分组。',
    'config.condition.groups.caution':
      '即使设置为显示，分组内的字段也不受影响。如需显示分组内的字段，请在「字段设置」中指定该字段。',
    'config.condition.groups.mode.add': '仅显示指定的分组',
    'config.condition.groups.mode.sub': '隐藏指定的分组',
    'config.condition.groups.label.add': '要显示的分组',
    'config.condition.groups.label.sub': '要隐藏的分组',
    'config.condition.groups.placeholder': '搜索分组字段',
    'config.condition.groups.empty': '未找到分组字段',
    'config.condition.spaces.title': '空白字段设置',
    'config.condition.spaces.description':
      '设置选中此标签时要显示或隐藏的空白字段。仅可选择设置了元素ID的空白字段。',
    'config.condition.spaces.mode.add': '仅显示指定的空白字段',
    'config.condition.spaces.mode.sub': '隐藏指定的空白字段',
    'config.condition.spaces.label.add': '要显示的空白字段',
    'config.condition.spaces.label.sub': '要隐藏的空白字段',
    'config.condition.spaces.placeholder': '搜索空白字段的元素ID',
    'config.condition.spaces.empty': '未找到设置了元素ID的空白字段',
    'config.condition.labels.title': '标签字段设置',
    'config.condition.labels.description': '设置选中此标签时要显示或隐藏的标签字段。',
    'config.condition.labels.caution':
      '未设置元素ID的标签字段通过文字识别，因此只要文字有变更，就会脱离此处的显示设置。在应用的表单设置中为标签设置元素ID后，将不再受文字变更影响，文字为空的标签也可以切换。',
    'config.condition.labels.mode.add': '仅显示指定的标签字段',
    'config.condition.labels.mode.sub': '隐藏指定的标签字段',
    'config.condition.labels.label.add': '要显示的标签字段',
    'config.condition.labels.label.sub': '要隐藏的标签字段',
    'config.condition.labels.placeholder': '搜索标签的元素ID或文字',
    'config.condition.labels.empty': '未找到标签字段',
    'config.condition.hr.title': '分隔线设置',
    'config.condition.hr.description':
      '设置选中此标签时要显示或隐藏的分隔线。仅可单独选择已设置元素ID的分隔线。',
    'config.condition.hr.hint':
      '未设置元素ID的分隔线无法单独选择，选择「仅显示指定的分隔线」时会全部隐藏，选择「隐藏指定的分隔线」时会全部显示。',
    'config.condition.hr.mode.add': '仅显示指定的分隔线',
    'config.condition.hr.mode.sub': '隐藏指定的分隔线',
    'config.condition.hr.label.add': '要显示的分隔线',
    'config.condition.hr.label.sub': '要隐藏的分隔线',
    'config.condition.hr.placeholder': '搜索分隔线的元素ID',
    'config.condition.hr.empty': '未找到已设置元素ID的分隔线',
    'config.error.formLoadFailure': '信息获取失败：{0}',
    'config.common.remembersSelectedTab.title': '标签的选中状态',
    'config.common.remembersSelectedTab.description':
      '记住最后选中的标签，下次打开同一应用的记录时恢复该状态。在URL中添加`?tab=标签名`（或`?tab=1`这样的编号）可以直接打开指定标签。',
    'config.common.remembersSelectedTab.label': '记住选中的标签',
    'config.common.notifiesMissingRequiredFields.title': '未填写的必填字段提示',
    'config.common.notifiesMissingRequiredFields.description':
      'kintone对隐藏的必填字段同样进行校验，因此未填写时保存会出现看不到原因的错误。启用后会在相应标签上加标记，并在保存时自动切换到该标签。',
    'config.common.notifiesMissingRequiredFields.label': '在标签上提示未填写的必填字段',
    'config.common.collapsesEmptyRows.title': '空行留下的空白',
    'config.common.collapsesEmptyRows.description':
      'kintone即使隐藏了行内的所有元素也会保留该行，因此可能会残留空白。启用后，将折叠没有任何可显示元素的行。',
    'config.common.collapsesEmptyRows.label': '折叠变空的行',
    'config.condition.screens.title': '显示标签的界面',
    'config.condition.screens.description':
      '选择显示此标签的界面。若一个都不选，此标签将不会在任何界面显示。',
    'config.condition.screens.empty': '保持此状态时，该标签不会在任何界面显示。',
    'config.condition.screens.create': '记录添加界面',
    'config.condition.screens.edit': '记录编辑界面',
    'config.condition.screens.detail': '记录详情界面',
    'config.condition.displayConditions.title': '基于记录值的显示条件',
    'config.condition.displayConditions.description':
      '仅当记录的值满足条件时显示此标签。未设置任何条件时始终显示。',
    'config.condition.displayConditions.logic': '条件的组合方式',
    'config.condition.displayConditions.logic.and': '满足所有条件（AND）',
    'config.condition.displayConditions.logic.or': '满足任一条件（OR）',
    'config.condition.displayConditions.add': '添加条件',
    'config.condition.displayConditions.delete': '删除此条件',
    'config.condition.viewers.title': '基于查看者的显示条件',
    'config.condition.viewers.description':
      '仅向指定的用户、组或组织显示此标签。全部为空时向所有人显示。',
    'config.condition.viewers.caution':
      '这只是显示的切换，并非访问控制。隐藏字段的值仍可从浏览器获取，如需限制权限请使用kintone的访问权限设置。',
    'config.condition.viewers.users': '目标用户',
    'config.condition.viewers.groups': '目标组',
    'config.condition.viewers.organizations': '目标组织',
    'config.condition.statuses.title': '基于状态的显示条件',
    'config.condition.statuses.description':
      '仅当流程管理处于指定状态时显示此标签。为空时在所有状态下显示。',
    'config.condition.statuses.label': '目标状态',
    'config.condition.statuses.disabled': '此应用未启用流程管理。',
    'desktop.tab.missingRequired': '存在未填写的必填字段',
    'desktop.error.rootNotFound': '未能获取用于渲染标签的目标元素',
  },
  'zh-TW': {
    'config.common.title': '分頁寬度',
    'config.common.description': '以px為單位指定記錄畫面中分頁的寬度。此設定對所有分頁生效。',
    'config.common.tabWidth.label': '分頁寬度（px）',
    'config.common.tabWidth.helper': '請在{0}〜{1}px的範圍內指定（預設值：{2}px）',
    'config.common.bulkEdit.title': '批次編輯',
    'config.common.bulkEdit.description':
      '列出應用程式表單上的所有元素，可統一設定各元素要顯示在哪些分頁。與各分頁的詳細設定編輯的是同一份設定，只是以元素為起點。',
    'config.common.bulkEdit.hint':
      '取消勾選的元素在該分頁中將被隱藏。此處的變更同樣會反映到各分頁的詳細設定。',
    'config.common.bulkEdit.element': '元素',
    'config.common.bulkEdit.type.field': '欄位',
    'config.common.bulkEdit.type.group': '群組',
    'config.common.bulkEdit.type.space': '空白',
    'config.common.bulkEdit.type.label': '標籤',
    'config.common.bulkEdit.type.hr': '分隔線',
    'config.common.bulkEdit.duplicated':
      '表單中有多個文字相同的標籤欄位。它們無法區分，因此會套用相同的設定。',
    'config.common.bulkEdit.anonymousSpace': '空白欄位（未設定元素ID，無法切換顯示與隱藏）',
    'config.common.bulkEdit.anonymousLabel':
      '標籤欄位（未設定元素ID且文字為空，無法切換顯示與隱藏）',
    'config.common.bulkEdit.anonymousHr': '分隔線（未設定元素ID，無法個別切換顯示與隱藏）',
    'config.common.bulkEdit.anonymous':
      '有{0}個元素因未設定元素ID而無法依分頁指派。在應用程式的表單設定中設定元素ID後，即可個別指派。若原本應隱藏的位置仍留有空白，請確認這些元素是否仍然顯示。',
    'config.common.bulkEdit.unassigned':
      '有{0}個元素未指派給任何分頁，它們在所有分頁中都會被隱藏。',
    'config.common.bulkEdit.unassignedElement':
      '此元素未指派給任何分頁，因此在所有分頁中都會被隱藏。',
    'config.common.bulkEdit.noTabs': '尚未新增分頁。請透過側邊欄的「+」按鈕新增。',
    'config.common.bulkEdit.noElements': '此應用程式的表單中沒有可切換顯示與隱藏的元素。',
    'config.common.bulkEdit.toggleColumn': '將所有元素指派給{0}',
    'config.common.bulkEdit.newElement.label': '之後新增至表單的元素的處理方式',
    'config.common.bulkEdit.newElement.description':
      '選擇儲存此設定後新增至應用程式的欄位等，在現有分頁中要如何處理。',
    'config.common.bulkEdit.newElement.show': '在所有分頁中顯示',
    'config.common.bulkEdit.newElement.hide': '在所有分頁中隱藏',
    'config.condition.tab.title': '分頁資訊',
    'config.condition.tab.description': '設定在記錄新增畫面與詳細畫面中顯示的分頁名稱。',
    'config.condition.tab.label': '分頁名稱',
    'config.condition.fields.title': '欄位設定',
    'config.condition.fields.description': '設定選取此分頁時要顯示或隱藏的欄位。',
    'config.condition.fields.mode.add': '僅顯示指定的欄位',
    'config.condition.fields.mode.sub': '隱藏指定的欄位',
    'config.condition.fields.label.add': '要顯示的欄位',
    'config.condition.fields.label.sub': '要隱藏的欄位',
    'config.condition.fields.placeholder': '搜尋欄位',
    'config.condition.groups.title': '群組欄位設定',
    'config.condition.groups.description': '設定選取此分頁時要顯示或隱藏的群組。',
    'config.condition.groups.caution':
      '即使設定為顯示，群組內的欄位也不受影響。若要顯示群組內的欄位，請於「欄位設定」中指定該欄位。',
    'config.condition.groups.mode.add': '僅顯示指定的群組',
    'config.condition.groups.mode.sub': '隱藏指定的群組',
    'config.condition.groups.label.add': '要顯示的群組',
    'config.condition.groups.label.sub': '要隱藏的群組',
    'config.condition.groups.placeholder': '搜尋群組欄位',
    'config.condition.groups.empty': '找不到群組欄位',
    'config.condition.spaces.title': '空白欄位設定',
    'config.condition.spaces.description':
      '設定選取此分頁時要顯示或隱藏的空白欄位。僅能選擇已設定元素ID的空白欄位。',
    'config.condition.spaces.mode.add': '僅顯示指定的空白欄位',
    'config.condition.spaces.mode.sub': '隱藏指定的空白欄位',
    'config.condition.spaces.label.add': '要顯示的空白欄位',
    'config.condition.spaces.label.sub': '要隱藏的空白欄位',
    'config.condition.spaces.placeholder': '搜尋空白欄位的元素ID',
    'config.condition.spaces.empty': '找不到已設定元素ID的空白欄位',
    'config.condition.labels.title': '標籤欄位設定',
    'config.condition.labels.description': '設定選取此分頁時要顯示或隱藏的標籤欄位。',
    'config.condition.labels.caution':
      '未設定元素ID的標籤欄位以文字識別，因此只要文字有變更，就會脫離此處的顯示設定。在應用程式的表單設定中為標籤設定元素ID後，將不再受文字變更影響，文字為空的標籤也可以切換。',
    'config.condition.labels.mode.add': '僅顯示指定的標籤欄位',
    'config.condition.labels.mode.sub': '隱藏指定的標籤欄位',
    'config.condition.labels.label.add': '要顯示的標籤欄位',
    'config.condition.labels.label.sub': '要隱藏的標籤欄位',
    'config.condition.labels.placeholder': '搜尋標籤的元素ID或文字',
    'config.condition.labels.empty': '找不到標籤欄位',
    'config.condition.hr.title': '分隔線設定',
    'config.condition.hr.description':
      '設定選取此分頁時要顯示或隱藏的分隔線。僅能個別選擇已設定元素ID的分隔線。',
    'config.condition.hr.hint':
      '未設定元素ID的分隔線無法個別選擇，選擇「僅顯示指定的分隔線」時會全部隱藏，選擇「隱藏指定的分隔線」時會全部顯示。',
    'config.condition.hr.mode.add': '僅顯示指定的分隔線',
    'config.condition.hr.mode.sub': '隱藏指定的分隔線',
    'config.condition.hr.label.add': '要顯示的分隔線',
    'config.condition.hr.label.sub': '要隱藏的分隔線',
    'config.condition.hr.placeholder': '搜尋分隔線的元素ID',
    'config.condition.hr.empty': '找不到已設定元素ID的分隔線',
    'config.error.formLoadFailure': '資訊取得失敗：{0}',
    'config.common.remembersSelectedTab.title': '分頁的選取狀態',
    'config.common.remembersSelectedTab.description':
      '記住最後選取的分頁，下次開啟同一應用程式的記錄時還原該狀態。在URL中加入`?tab=分頁名稱`（或`?tab=1`這樣的編號）可直接開啟指定分頁。',
    'config.common.remembersSelectedTab.label': '記住選取的分頁',
    'config.common.notifiesMissingRequiredFields.title': '未填寫的必填欄位提示',
    'config.common.notifiesMissingRequiredFields.description':
      'kintone對隱藏的必填欄位同樣進行驗證，因此未填寫時儲存會出現看不到原因的錯誤。啟用後會在對應分頁上加上標記，並在儲存時自動切換到該分頁。',
    'config.common.notifiesMissingRequiredFields.label': '在分頁上提示未填寫的必填欄位',
    'config.common.collapsesEmptyRows.title': '空行留下的空白',
    'config.common.collapsesEmptyRows.description':
      'kintone即使隱藏了行內的所有元素也會保留該行，因此可能會殘留空白。啟用後，將摺疊沒有任何可顯示元素的行。',
    'config.common.collapsesEmptyRows.label': '摺疊變空的行',
    'config.condition.screens.title': '顯示分頁的畫面',
    'config.condition.screens.description':
      '選擇顯示此分頁的畫面。若一個都不選，此分頁將不會在任何畫面顯示。',
    'config.condition.screens.empty': '保持此狀態時，該分頁不會在任何畫面顯示。',
    'config.condition.screens.create': '記錄新增畫面',
    'config.condition.screens.edit': '記錄編輯畫面',
    'config.condition.screens.detail': '記錄詳細畫面',
    'config.condition.displayConditions.title': '依記錄值的顯示條件',
    'config.condition.displayConditions.description':
      '僅在記錄的值符合條件時顯示此分頁。未設定任何條件時一律顯示。',
    'config.condition.displayConditions.logic': '條件的結合方式',
    'config.condition.displayConditions.logic.and': '符合所有條件（AND）',
    'config.condition.displayConditions.logic.or': '符合任一條件（OR）',
    'config.condition.displayConditions.add': '新增條件',
    'config.condition.displayConditions.delete': '刪除此條件',
    'config.condition.viewers.title': '依瀏覽者的顯示條件',
    'config.condition.viewers.description':
      '僅向指定的使用者、群組或組織顯示此分頁。全部為空時向所有人顯示。',
    'config.condition.viewers.caution':
      '這只是顯示的切換，並非存取控制。隱藏欄位的值仍可從瀏覽器取得，若需限制權限請使用kintone的存取權設定。',
    'config.condition.viewers.users': '目標使用者',
    'config.condition.viewers.groups': '目標群組',
    'config.condition.viewers.organizations': '目標組織',
    'config.condition.statuses.title': '依狀態的顯示條件',
    'config.condition.statuses.description':
      '僅在流程管理處於指定狀態時顯示此分頁。為空時在所有狀態下顯示。',
    'config.condition.statuses.label': '目標狀態',
    'config.condition.statuses.disabled': '此應用程式未啟用流程管理。',
    'desktop.tab.missingRequired': '有未填寫的必填欄位',
    'desktop.error.rootNotFound': '無法取得用於繪製分頁的目標元素',
  },
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});
