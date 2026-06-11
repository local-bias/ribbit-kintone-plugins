import { createTheme } from '@mui/material';
import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';
import { LANGUAGE } from './global';

export const ui = {
  ja: {
    'common.config.rootIsLoading': '画面の描画を待機しています',
    'common.config.formIsLoading': '設定情報を取得しています',
    'common.config.sidebar.tab.common.label': '共通設定',
    'common.config.sidebar.tab.label': '設定',
    'common.config.sidebar.tab.defaultLabel': '未設定',
    'common.config.sidebar.context.onCopy': '設定情報をコピーしました',
    'common.config.sidebar.context.onPaste': '設定情報を貼り付けました',
    'common.config.sidebar.context.onPasteFailure': '設定情報の形式が正しくありません',
    'common.config.button.save': '設定を保存',
    'common.config.button.return': 'プラグイン一覧へ戻る',
    'common.config.toast.save': '設定を保存しました',
    'common.config.toast.onConditionDelete': '設定情報を削除しました',
    'common.config.toast.reset': '設定をリセットしました',
    'common.config.toast.import': '設定情報をインポートしました',
    'common.config.toast.export': 'プラグインの設定情報をエクスポートしました',
    'common.config.error.rootNotFound':
      'プラグインのHTMLに、ルート要素が存在しません。プラグイン設定をレンダリングするためには、id="settings"の要素が必要です。',
    'common.config.error.import':
      '設定情報のインポートに失敗しました、ファイルに誤りがないか確認してください',
    'common.config.error.export':
      'プラグインの設定情報のエクスポートに失敗しました。プラグイン開発者にお問い合わせください。',

    'error.config.root':
      'プラグインのHTMLに、ルート要素が存在しません。プラグイン設定をレンダリングするためには、id="settings"の要素が必要です。',

    'config.condition.dstAppId.title': '更新するアプリ',
    'config.condition.dstAppId.description':
      'このアプリのレコードを更新したタイミングで、合わせて更新するアプリを選択してください',
    'config.condition.dstAppId.label': 'アプリ名(アプリID)',
    'config.condition.dstAppId.placeholder': 'アプリを選択',

    'config.condition.keyFieldCode.title': '更新のキーとなるフィールド',
    'config.condition.keyFieldCode.description1':
      '更新した際に、このフィールドの値をキーとして、更新対象のレコードを特定します',
    'config.condition.keyFieldCode.description2':
      'このフィールドの値が変更された場合、レコード保存直前(変更後)の値が参照されます。',
    'config.condition.keyFieldCode.src.label': 'このアプリのキーフィールド',
    'config.condition.keyFieldCode.dst.label': '更新先アプリのキーフィールド',

    'config.condition.createIfNotExists.label':
      '更新先アプリに対象となるレコードが存在しない場合、新規作成する',

    'config.condition.bindings.title': '紐づけ設定',
    'config.condition.bindings.description':
      'キーが一致したレコードの、更新を行うフィールドを設定します',
    'config.condition.bindings.src.label': 'このアプリのフィールド',
    'config.condition.bindings.dst.label': '更新先アプリのフィールド',
    'config.condition.bindings.add': '紐づけ設定を追加',
    'config.condition.bindings.delete': '紐づけ設定を削除',

    'config.condition.bindings.type.label': '更新タイプ',
    'config.condition.bindings.type.field': 'フィールドコピー',
    'config.condition.bindings.type.fixed': '固定値',
    'config.condition.bindings.type.concat': '文字列結合',
    'config.condition.bindings.type.calc': '計算',
    'config.condition.bindings.type.date_offset': '日付オフセット',

    'config.condition.bindings.fixed.label': '固定値',
    'config.condition.bindings.fixed.placeholder': '値を入力',

    'config.condition.bindings.concat.hint':
      '「フィールド」ボタンからフィールドコードを埋め込めます。フィールド以外の部分は固定テキストとして扱われます。',

    'config.condition.bindings.calc.label': '計算式',
    'config.condition.bindings.calc.hint':
      '+, -, *, / で四則演算ができます。フィールドコードを埋め込むと、そのフィールドの数値を演算に使用できます。',
    'config.condition.bindings.calc.invalidExpression': '計算式の形式が正しくありません',

    'config.condition.bindings.date_offset.srcField': '基準日フィールド',
    'config.condition.bindings.date_offset.offsetValue': '加減算する値',
    'config.condition.bindings.date_offset.offsetUnit': '単位',
    'config.condition.bindings.date_offset.unit.day': '日',
    'config.condition.bindings.date_offset.unit.month': '月',
    'config.condition.bindings.date_offset.unit.year': '年',
    'config.condition.bindings.date_offset.hint':
      '基準となる日付フィールドの値に、指定した日数・月数・年数を加算（正の値）または減算（負の値）した日付を設定します。',

    'config.condition.srcQuery.title': '実行条件(このアプリ)',
    'config.condition.srcQuery.description':
      '指定したクエリに一致するレコードが更新された場合のみ、更新を行います',
    'config.condition.srcQuery.label': 'クエリ',
    'config.condition.srcQuery.placeholder': '[フィールド名] = "値"',

    'config.condition.dstQuery.title': '実行条件(更新先アプリ)',
    'config.condition.dstQuery.description':
      '更新のキーに加えて、指定したクエリに一致するレコードのみ、更新を行います',
    'config.condition.dstQuery.label': 'クエリ',
    'config.condition.dstQuery.placeholder': '[フィールド名] = "値"',

    'config.common.showResult.title': '更新結果の表示',
    'config.common.showResult.description':
      '紐づけた他アプリの更新結果を表示します。表示するよう設定した場合は、レコード保存時にダイアログが表示され、閉じるボタンを押すまで処理が中断されます。ダイアログを表示しない場合、更新に失敗した場合も画面上には何も表示されません。',
    'config.common.showResult.label': '更新結果を表示する',

    'config.sidebar.tab.common.label': '共通設定',
    'config.sidebar.tab.label': '設定',
    'config.button.save': '設定を保存',
    'config.button.return': 'プラグイン一覧へ戻る',
    'config.toast.save': '設定を保存しました',
    'config.toast.reset': '設定をリセットしました',
    'config.toast.import': '設定情報をインポートしました',
    'config.toast.export': 'プラグインの設定情報をエクスポートしました',
    'config.error.root':
      'プラグインのHTMLに、ルート要素が存在しません。プラグイン設定をレンダリングするためには、id="settings"の要素が必要です。',
    'config.error.import':
      '設定情報のインポートに失敗しました、ファイルに誤りがないか確認してください',
    'config.error.export':
      'プラグインの設定情報のエクスポートに失敗しました。プラグイン開発者にお問い合わせください。',
    'config.condition.queryBuilder.field': 'フィールド',
    'config.condition.queryBuilder.operator': '演算子',
    'config.condition.queryBuilder.value': '値',
    'config.condition.queryBuilder.addCondition': '条件を追加',
    'config.condition.queryBuilder.deleteCondition': '条件を削除',
    'config.condition.queryBuilder.noConditions':
      '条件が設定されていません。条件を追加すると、対象のレコードを絞り込むことができます。',
    'config.condition.queryBuilder.switchToRaw': 'クエリを直接入力する',
    'config.condition.queryBuilder.switchToBuilder': '条件入力フォームに切り替える',
    'config.condition.queryBuilder.rawLabel': 'クエリ',
    'config.condition.queryBuilder.addGroup': '条件グループを追加',
    'config.condition.queryBuilder.deleteGroup': 'グループを削除',
    'config.condition.queryBuilder.groupJoin': 'グループ内の結合',
    'config.condition.queryBuilder.groupsJoin': 'グループ間の結合',
    'config.condition.queryBuilder.addValue': '追加',
    'config.condition.queryBuilder.inPlaceholder': '値を入力してEnterで追加',
    'config.condition.srcQuery.builderDescription':
      '編集中のレコードの情報に応じて、更新有無を判断します。ここで設定した条件に一致するレコードのみ、更新が実行されます。未設定の場合はレコードを限定しません。条件は保存直前のレコードの情報をもとに判断されます。',

    'config.condition.srcConditions.tab.modern': 'モダン',
    'config.condition.srcConditions.tab.legacy': 'レガシー',
    'config.condition.srcConditions.priorityDescription':
      '「モダン」タブに1件以上の条件が設定されている場合はその条件を使用します。「モダン」タブが空の場合は「レガシー」タブのクエリを使用します。両方未設定の場合は、すべてのレコードを対象に更新を実行します。',
    'config.condition.srcConditions.modernDescription':
      '編集中のレコードのフィールド値を直接評価します。APIによるレコード取得を行わないため、高速です。未設定の場合はレコードを限定しません。',
    'config.condition.srcConditions.legacyDescription':
      'クエリを使ったAPIによる判定です。既存の設定を引き続き使用できます。新しい設定が空の場合にこちらの設定が使用されます。',
    'config.condition.srcConditions.add': '条件を追加',
    'config.condition.srcConditions.delete': '条件を削除',
    'config.condition.dstQuery.builderDescription':
      '更新のキーに加えて、更新対象のレコードをさらに絞り込みます。条件を設定した場合、更新のキーと一致し、かつ条件に一致するレコードのみ、更新が実行されます。未設定の場合はレコードを限定しません。',
    'desktop.dialogtrigger.title': 'プラグインが有効です',
    'desktop.dialogtrigger.content': 'クリックするとイベントの詳細を確認できます',
    'desktop.dialog.title': 'プラグインの設定情報',
    'desktop.error.title': 'エラーが発生しました',
    'desktop.error.unknown': '不明なエラーが発生しました',
    'desktop.resultDialog.title': '他アプリの更新結果',

    'config.condition.triggerEvents.title': 'トリガーイベント',
    'config.condition.triggerEvents.description': 'この設定が実行されるイベントを選択してください',
    'config.condition.triggerEvents.create': 'レコード作成時',
    'config.condition.triggerEvents.update': 'レコード編集時',
    'config.condition.triggerEvents.delete': 'レコード削除時',
    'config.condition.triggerEvents.process': 'プロセス変更時',
    'config.condition.processOptions.description':
      '空の場合はすべてのアクション・ステータスに対応します',
    'config.condition.processOptions.actions.label': '対象アクション',
    'config.condition.processOptions.actions.placeholder': 'アクションを選択',
    'config.condition.processOptions.statuses.label': '対象ステータス（変更後）',
    'config.condition.processOptions.statuses.placeholder': 'ステータスを選択',
    'config.condition.deleteRelatedRecords.label':
      '条件を満たすとき、連携先の対象レコードを削除する',
  },
  en: {
    'error.config.root':
      'The root element does not exist in the plugin HTML. To render the plugin configuration, an element with id="settings" is required.',
    'config.condition.dstAppId.title': 'Destination App',
    'config.condition.dstAppId.description':
      'Select the app to update when records in this app are updated.',
    'config.condition.dstAppId.label': 'App Name (App ID)',
    'config.condition.dstAppId.placeholder': 'Select an app',
    'config.condition.keyFieldCode.title': 'Key Field for Update',
    'config.condition.keyFieldCode.description1':
      'Specify the field whose value will be used as the key to identify the records to update.',
    'config.condition.keyFieldCode.src.label': 'Key Field in This App',
    'config.condition.keyFieldCode.dst.label': 'Key Field in Destination App',
    'config.condition.bindings.title': 'Binding Settings',
    'config.condition.bindings.description':
      'Set the fields to update for records that match the key.',
    'config.condition.bindings.src.label': 'Fields in This App',
    'config.condition.bindings.dst.label': 'Fields in Destination App',
    'config.condition.bindings.add': 'Add Binding Setting',
    'config.condition.bindings.delete': 'Delete Binding Setting',

    'config.condition.bindings.type.label': 'Update Type',
    'config.condition.bindings.type.field': 'Field Copy',
    'config.condition.bindings.type.fixed': 'Fixed Value',
    'config.condition.bindings.type.concat': 'Text Concatenation',
    'config.condition.bindings.type.calc': 'Calculation',
    'config.condition.bindings.type.date_offset': 'Date Offset',

    'config.condition.bindings.fixed.label': 'Fixed Value',
    'config.condition.bindings.fixed.placeholder': 'Enter a value',

    'config.condition.bindings.concat.hint':
      'Use the "Field" button to embed field codes. Non-field parts are treated as fixed text.',

    'config.condition.bindings.calc.label': 'Expression',
    'config.condition.bindings.calc.hint':
      'Use +, -, *, / for arithmetic. Embed field codes to use their numeric values in the calculation.',
    'config.condition.bindings.calc.invalidExpression': 'The expression is not valid',

    'config.condition.bindings.date_offset.srcField': 'Base Date Field',
    'config.condition.bindings.date_offset.offsetValue': 'Offset Value',
    'config.condition.bindings.date_offset.offsetUnit': 'Unit',
    'config.condition.bindings.date_offset.unit.day': 'Day(s)',
    'config.condition.bindings.date_offset.unit.month': 'Month(s)',
    'config.condition.bindings.date_offset.unit.year': 'Year(s)',
    'config.condition.bindings.date_offset.hint':
      'Adds (positive) or subtracts (negative) the specified number of days, months, or years from the base date field.',
    'config.condition.srcQuery.title': 'Source Query',
    'config.condition.srcQuery.description': 'Only update records that match the specified query.',
    'config.condition.srcQuery.label': 'Query',
    'config.condition.srcQuery.placeholder': '[Field Name] = "Value"',
    'config.condition.dstQuery.title': 'Destination Query',
    'config.condition.dstQuery.description': 'Only update records that match the specified query.',
    'config.condition.dstQuery.label': 'Query',
    'config.condition.dstQuery.placeholder': '[Field Name] = "Value"',
    'config.sidebar.tab.label': 'Settings',
    'config.button.save': 'Save Settings',
    'config.button.return': 'Return to Plugin List',
    'config.toast.save': 'Settings saved',
    'config.toast.reset': 'Settings reset',
    'config.toast.import': 'Settings imported',
    'config.toast.export': 'Plugin settings exported',
    'config.error.root':
      'The root element does not exist in the plugin HTML. To render the plugin configuration, an element with id="settings" is required.',
    'config.error.import': 'Failed to import settings. Please check the file for errors.',
    'config.error.export': 'Failed to export plugin settings. Please contact the plugin developer.',
    'config.condition.queryBuilder.field': 'Field',
    'config.condition.queryBuilder.operator': 'Operator',
    'config.condition.queryBuilder.value': 'Value',
    'config.condition.queryBuilder.addCondition': 'Add condition',
    'config.condition.queryBuilder.deleteCondition': 'Delete condition',
    'config.condition.queryBuilder.noConditions':
      'No conditions set. Add conditions to filter target records.',
    'config.condition.queryBuilder.switchToRaw': 'Enter query directly',
    'config.condition.queryBuilder.switchToBuilder': 'Switch to condition form',
    'config.condition.queryBuilder.rawLabel': 'Query',
    'config.condition.queryBuilder.addGroup': 'Add condition group',
    'config.condition.queryBuilder.deleteGroup': 'Delete group',
    'config.condition.queryBuilder.groupJoin': 'Join within group',
    'config.condition.queryBuilder.groupsJoin': 'Join between groups',
    'config.condition.queryBuilder.addValue': 'Add',
    'config.condition.queryBuilder.inPlaceholder': 'Type a value and press Enter to add',
    'config.condition.srcQuery.builderDescription':
      'Select fields from this app to set filter conditions for source records',

    'config.condition.srcConditions.tab.modern': 'Modern',
    'config.condition.srcConditions.tab.legacy': 'Legacy',
    'config.condition.srcConditions.priorityDescription':
      'If one or more conditions are set in the "Modern" tab, those conditions will be used. If the "Modern" tab is empty, the query from the "Legacy" tab will be used. If neither is set, all records will be targeted.',
    'config.condition.srcConditions.modernDescription':
      'Directly evaluates the field values of the record being edited. Faster since no API record fetch is needed. Leaving this empty imposes no restriction.',
    'config.condition.srcConditions.legacyDescription':
      'Uses API-based evaluation with a query. Existing settings continue to work. This setting is used when the modern conditions are empty.',
    'config.condition.srcConditions.add': 'Add condition',
    'config.condition.srcConditions.delete': 'Delete condition',
    'config.condition.dstQuery.builderDescription':
      'Select fields from the destination app to set filter conditions for destination records',

    'desktop.dialogtrigger.title': 'Plugin Enabled',
    'desktop.dialogtrigger.content': 'Click to view event details',
    'desktop.dialog.title': 'Plugin Configuration',

    'config.condition.triggerEvents.title': 'Trigger Events',
    'config.condition.triggerEvents.description':
      'Select the events that trigger this configuration.',
    'config.condition.triggerEvents.create': 'On record creation',
    'config.condition.triggerEvents.update': 'On record edit',
    'config.condition.triggerEvents.delete': 'On record deletion',
    'config.condition.triggerEvents.process': 'On process change',
    'config.condition.processOptions.description':
      'If left empty, all actions and statuses will be targeted.',
    'config.condition.processOptions.actions.label': 'Target Actions',
    'config.condition.processOptions.actions.placeholder': 'Select actions',
    'config.condition.processOptions.statuses.label': 'Target Statuses (after change)',
    'config.condition.processOptions.statuses.placeholder': 'Select statuses',
    'config.condition.deleteRelatedRecords.label':
      'Delete matching records in the destination app when conditions are met',
  },
  es: {
    'error.config.root':
      'El elemento raíz no existe en el HTML del complemento. Para renderizar la configuración del complemento, se requiere un elemento con id="settings".',
    'config.condition.dstAppId.title': 'Aplicación de destino',
    'config.condition.dstAppId.description':
      'Seleccione la aplicación que se actualizará cuando se actualicen los registros en esta aplicación.',
    'config.condition.dstAppId.label': 'Nombre de la aplicación (ID de la aplicación)',
    'config.condition.dstAppId.placeholder': 'Seleccionar una aplicación',
    'config.condition.keyFieldCode.title': 'Campo clave para la actualización',
    'config.condition.keyFieldCode.description1':
      'Especifique el campo cuyo valor se utilizará como clave para identificar los registros que se actualizarán.',
    'config.condition.keyFieldCode.src.label': 'Campo clave en esta aplicación',
    'config.condition.keyFieldCode.dst.label': 'Campo clave en la aplicación de destino',
    'config.condition.bindings.title': 'Configuración de vinculación',
    'config.condition.bindings.description':
      'Establezca los campos para actualizar los registros que coincidan con la clave.',
    'config.condition.bindings.src.label': 'Campos en esta aplicación',
    'config.condition.bindings.dst.label': 'Campos en la aplicación de destino',
    'config.condition.bindings.add': 'Agregar configuración de vinculación',
    'config.condition.bindings.delete': 'Eliminar configuración de vinculación',

    'config.condition.bindings.type.label': 'Tipo de actualización',
    'config.condition.bindings.type.field': 'Copiar campo',
    'config.condition.bindings.type.fixed': 'Valor fijo',
    'config.condition.bindings.type.concat': 'Concatenación de texto',
    'config.condition.bindings.type.calc': 'Cálculo',
    'config.condition.bindings.type.date_offset': 'Desplazamiento de fecha',

    'config.condition.bindings.fixed.label': 'Valor fijo',
    'config.condition.bindings.fixed.placeholder': 'Ingrese un valor',

    'config.condition.bindings.concat.hint':
      'Use el botón "Campo" para insertar códigos de campo. Las partes que no son campos se tratan como texto fijo.',

    'config.condition.bindings.calc.label': 'Expresión',
    'config.condition.bindings.calc.hint':
      'Use +, -, *, / para aritmética. Inserte códigos de campo para usar sus valores numéricos en el cálculo.',
    'config.condition.bindings.calc.invalidExpression': 'La expresión no es válida',

    'config.condition.bindings.date_offset.srcField': 'Campo de fecha base',
    'config.condition.bindings.date_offset.offsetValue': 'Valor de desplazamiento',
    'config.condition.bindings.date_offset.offsetUnit': 'Unidad',
    'config.condition.bindings.date_offset.unit.day': 'Día(s)',
    'config.condition.bindings.date_offset.unit.month': 'Mes(es)',
    'config.condition.bindings.date_offset.unit.year': 'Año(s)',
    'config.condition.bindings.date_offset.hint':
      'Suma (valor positivo) o resta (valor negativo) el número especificado de días, meses o años al campo de fecha base.',
    'config.condition.srcQuery.title': 'Consulta de origen',
    'config.condition.srcQuery.description':
      'Solo actualizar registros que coincidan con la consulta especificada.',
    'config.condition.srcQuery.label': 'Consulta',
    'config.condition.srcQuery.placeholder': '[Nombre del campo] = "Valor"',
    'config.condition.dstQuery.title': 'Consulta de destino',
    'config.condition.dstQuery.description':
      'Solo actualizar registros que coincidan con la consulta especificada.',
    'config.condition.dstQuery.label': 'Consulta',
    'config.condition.dstQuery.placeholder': '[Nombre del campo] = "Valor"',
    'config.sidebar.tab.label': 'Configuración',
    'config.button.save': 'Guardar configuración',
    'config.button.return': 'Volver a la lista de complementos',
    'config.toast.save': 'Configuración guardada',
    'config.toast.reset': 'Configuración restablecida',
    'config.toast.import': 'Configuración importada',
    'config.toast.export': 'Configuración del complemento exportada',
    'config.error.root':
      'El elemento raíz no existe en el HTML del complemento. Para renderizar la configuración del complemento, se requiere un elemento con id="settings".',
    'config.error.import':
      'Error al importar la configuración. Por favor, verifique el archivo en busca de errores.',
    'config.error.export':
      'Error al exportar la configuración del complemento. Por favor, contacte al desarrollador del complemento.',
    'config.condition.queryBuilder.field': 'Campo',
    'config.condition.queryBuilder.operator': 'Operador',
    'config.condition.queryBuilder.value': 'Valor',
    'config.condition.queryBuilder.addCondition': 'Agregar condición',
    'config.condition.queryBuilder.deleteCondition': 'Eliminar condición',
    'config.condition.queryBuilder.noConditions':
      'No hay condiciones establecidas. Agregue condiciones para filtrar los registros.',
    'config.condition.queryBuilder.switchToRaw': 'Ingresar consulta directamente',
    'config.condition.queryBuilder.switchToBuilder': 'Cambiar al formulario de condiciones',
    'config.condition.queryBuilder.rawLabel': 'Consulta',
    'config.condition.queryBuilder.addGroup': 'Agregar grupo de condiciones',
    'config.condition.queryBuilder.deleteGroup': 'Eliminar grupo',
    'config.condition.queryBuilder.groupJoin': 'Unión dentro del grupo',
    'config.condition.queryBuilder.groupsJoin': 'Unión entre grupos',
    'config.condition.queryBuilder.addValue': 'Agregar',
    'config.condition.queryBuilder.inPlaceholder': 'Escriba un valor y presione Enter para agregar',
    'config.condition.srcQuery.builderDescription':
      'Seleccione campos de esta aplicación para configurar las condiciones de filtrado',
    'config.condition.dstQuery.builderDescription':
      'Seleccione campos de la aplicación de destino para configurar las condiciones de filtrado',

    'desktop.dialogtrigger.title': 'Complemento habilitado',
    'desktop.dialogtrigger.content': 'Haz clic para ver los detalles del evento',
    'desktop.dialog.title': 'Configuración del complemento',

    'config.condition.triggerEvents.title': 'Eventos de activación',
    'config.condition.triggerEvents.description':
      'Seleccione los eventos que activan esta configuración.',
    'config.condition.triggerEvents.create': 'Al crear registro',
    'config.condition.triggerEvents.update': 'Al editar registro',
    'config.condition.triggerEvents.delete': 'Al eliminar registro',
    'config.condition.triggerEvents.process': 'Al cambiar proceso',
    'config.condition.processOptions.description':
      'Si se deja vacío, se aplicará a todas las acciones y estados.',
    'config.condition.processOptions.actions.label': 'Acciones objetivo',
    'config.condition.processOptions.actions.placeholder': 'Seleccionar acciones',
    'config.condition.processOptions.statuses.label': 'Estados objetivo (después del cambio)',
    'config.condition.processOptions.statuses.placeholder': 'Seleccionar estados',
    'config.condition.deleteRelatedRecords.label':
      'Eliminar registros coincidentes en la aplicación de destino cuando se cumplan las condiciones',
  },
  zh: {
    'error.config.root': '插件HTML中不存在根元素。要渲染插件配置，需要一个id="settings"的元素。',
    'config.condition.dstAppId.title': '目标应用',
    'config.condition.dstAppId.description': '选择在更新此应用的记录时要更新的应用。',
    'config.condition.dstAppId.label': '应用名称（应用ID）',
    'config.condition.dstAppId.placeholder': '选择一个应用',
    'config.condition.keyFieldCode.title': '更新的关键字段',
    'config.condition.keyFieldCode.description1': '指定用作标识要更新的记录的键的字段的值。',
    'config.condition.keyFieldCode.src.label': '此应用中的关键字段',
    'config.condition.keyFieldCode.dst.label': '目标应用中的关键字段',
    'config.condition.bindings.title': '绑定设置',
    'config.condition.bindings.description': '设置与键匹配的记录的要更新的字段。',
    'config.condition.bindings.src.label': '此应用中的字段',
    'config.condition.bindings.dst.label': '目标应用中的字段',
    'config.condition.bindings.add': '添加绑定设置',
    'config.condition.bindings.delete': '删除绑定设置',

    'config.condition.bindings.type.label': '更新类型',
    'config.condition.bindings.type.field': '字段复制',
    'config.condition.bindings.type.fixed': '固定值',
    'config.condition.bindings.type.concat': '文本拼接',
    'config.condition.bindings.type.calc': '计算',
    'config.condition.bindings.type.date_offset': '日期偏移',

    'config.condition.bindings.fixed.label': '固定值',
    'config.condition.bindings.fixed.placeholder': '请输入值',

    'config.condition.bindings.concat.hint':
      '点击"字段"按钮可插入字段代码。非字段部分将被视为固定文本。',

    'config.condition.bindings.calc.label': '计算公式',
    'config.condition.bindings.calc.hint':
      '使用 +, -, *, / 进行四则运算。嵌入字段代码可将其数值用于计算。',
    'config.condition.bindings.calc.invalidExpression': '计算公式格式不正确',

    'config.condition.bindings.date_offset.srcField': '基准日期字段',
    'config.condition.bindings.date_offset.offsetValue': '偏移量',
    'config.condition.bindings.date_offset.offsetUnit': '单位',
    'config.condition.bindings.date_offset.unit.day': '天',
    'config.condition.bindings.date_offset.unit.month': '月',
    'config.condition.bindings.date_offset.unit.year': '年',
    'config.condition.bindings.date_offset.hint':
      '在基准日期字段的值上加（正数）或减（负数）指定的天数、月数或年数。',
    'config.condition.srcQuery.title': '源查询',
    'config.condition.srcQuery.description': '仅更新与指定查询匹配的记录。',
    'config.condition.srcQuery.label': '查询',
    'config.condition.srcQuery.placeholder': '[字段名] = "值"',
    'config.condition.dstQuery.title': '目标查询',
    'config.condition.dstQuery.description': '仅更新与指定查询匹配的记录。',
    'config.condition.dstQuery.label': '查询',
    'config.condition.dstQuery.placeholder': '[字段名] = "值"',
    'config.sidebar.tab.label': '设置',
    'config.button.save': '保存设置',
    'config.button.return': '返回插件列表',
    'config.toast.save': '设置已保存',
    'config.toast.reset': '设置已重置',
    'config.toast.import': '已导入设置',
    'config.toast.export': '已导出插件设置',
    'config.error.root': '插件HTML中不存在根元素。要渲染插件配置，需要一个id="settings"的元素。',
    'config.error.import': '导入设置失败。请检查文件是否有错误。',
    'config.error.export': '导出插件设置失败。请联系插件开发者。',
    'config.condition.queryBuilder.field': '字段',
    'config.condition.queryBuilder.operator': '运算符',
    'config.condition.queryBuilder.value': '值',
    'config.condition.queryBuilder.addCondition': '添加条件',
    'config.condition.queryBuilder.deleteCondition': '删除条件',
    'config.condition.queryBuilder.noConditions': '未设置条件。添加条件以筛选目标记录。',
    'config.condition.queryBuilder.switchToRaw': '直接输入查询',
    'config.condition.queryBuilder.switchToBuilder': '切换到条件表单',
    'config.condition.queryBuilder.rawLabel': '查询',
    'config.condition.queryBuilder.addGroup': '添加条件组',
    'config.condition.queryBuilder.deleteGroup': '删除组',
    'config.condition.queryBuilder.groupJoin': '组内连接',
    'config.condition.queryBuilder.groupsJoin': '组间连接',
    'config.condition.queryBuilder.addValue': '添加',
    'config.condition.queryBuilder.inPlaceholder': '输入值后按回车添加',
    'config.condition.srcQuery.builderDescription': '选择此应用的字段以设置源记录的筛选条件',
    'config.condition.dstQuery.builderDescription': '选择目标应用的字段以设置目标记录的筛选条件',

    'desktop.dialogtrigger.title': '插件已启用',
    'desktop.dialogtrigger.content': '单击以查看事件详细信息',
    'desktop.dialog.title': '插件配置',

    'config.condition.triggerEvents.title': '触发事件',
    'config.condition.triggerEvents.description': '选择触发此配置的事件。',
    'config.condition.triggerEvents.create': '创建记录时',
    'config.condition.triggerEvents.update': '编辑记录时',
    'config.condition.triggerEvents.delete': '删除记录时',
    'config.condition.triggerEvents.process': '更改流程时',
    'config.condition.processOptions.description': '留空则适用于所有操作和状态。',
    'config.condition.processOptions.actions.label': '目标操作',
    'config.condition.processOptions.actions.placeholder': '选择操作',
    'config.condition.processOptions.statuses.label': '目标状态（更改后）',
    'config.condition.processOptions.statuses.placeholder': '选择状态',
    'config.condition.deleteRelatedRecords.label': '满足条件时删除目标应用中的匹配记录',
  },
} as const;

export type Language = keyof typeof ui;

export const defaultLang = 'ja' satisfies Language;

const isSupportedLang = (lang: string): lang is Language => lang in ui;

/**
 * 指定された言語に対応する翻訳関数を返します。
 * @param lang - 言語のキー
 * @returns 指定された言語に対応する翻訳関数
 */
export function useTranslations(lang: string = defaultLang) {
  const validLang = isSupportedLang(lang) ? lang : defaultLang;

  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    /* eslint @typescript-eslint/ban-ts-comment: 0 */
    // @ts-expect-error デフォルト言語以外の設定が不十分な場合は、デフォルト言語の設定を使用します
    return ui[validLang][key] ?? ui[defaultLang][key];
  };
}

export const t = useTranslations(LANGUAGE as Language);

export const getMUITheme = () => {
  return createTheme(
    {},
    LANGUAGE === 'en' ? enUS : LANGUAGE === 'zh' ? zhCN : LANGUAGE === 'es' ? esES : jaJP
  );
};
