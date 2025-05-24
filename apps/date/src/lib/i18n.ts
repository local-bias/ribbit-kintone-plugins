import { createTheme } from '@mui/material';
import { LANGUAGE } from './global';
import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';
import { commonUi, useTranslations } from '@repo/utils';
import { mergeDeep } from 'remeda';

const ui = mergeDeep(commonUi, {
  ja: {
    'config.condition.targetFieldCode.title': '対象フィールド',
    'config.condition.targetFieldCode.description':
      'プラグインによって制御する対象となるフィールドを指定してください。',
    'config.condition.targetFieldCode.label': '対象フィールド',
    'config.condition.targetFieldCode.placeholder': 'フィールド名(フィールドコード)',
    'config.condition.isTargetFieldDisabled.label': 'フィールドを直接編集することを禁止する',
    'config.condition.basisType.title': '基準となる日付',
    'config.condition.basisType.description':
      '基準となる日付を指定してください。現在の日付を基準にするか、フィールドの値を基準にするかを選択します。',
    'config.condition.basisFieldCode.title': '基準フィールド',
    'config.condition.basisFieldCode.description':
      '基準とするフィールドを指定してください。基準日がフィールドの値になります。文字列一行フィールドを設定することもできますが、日付のフォーマットとして適切でない場合はエラーとなります。',
    'config.condition.basisFieldCode.label': '基準フィールド',
    'config.condition.adjustments.title': '日付の制御',
    'config.condition.adjustments.description': '基準日から加算・減算を行う方法を設定します',
    'config.condition.bulkUpdate.title': '一括更新',
    'config.condition.bulkUpdate.description':
      '一覧の検索条件に一致するレコードを一括更新することができます。設定を有効にすると、一覧に一括更新ボタンを表示します。',
    'config.condition.isBulkUpdateButtonVisible.label': '一括更新ボタンを表示する',
    'config.condition.isBulkUpdateButtonVisibleForSpecificEntities.label':
      '一括更新ボタンを表示するユーザーを制御する',

    'desktop.bulkUpdate.dialog.title': '一括更新',
    'desktop.bulkUpdate.dialog.description':
      '現在の一覧の検索条件に一致するすべてのレコードを更新します。よろしいですか？',
    'desktop.bulkUpdate.loading.label.get': '対象レコードを取得しています',
    'desktop.bulkUpdate.loading.label.update': 'レコードを更新しています',
    'desktop.bulkUpdate.success.dialog.title': '更新が完了しました',
    'desktop.bulkUpdate.success.dialog.description': '件のレコードを更新しました',
    'desktop.bulkUpdate.notFound.dialog.title': '更新対象が見つかりませんでした',
    'desktop.bulkUpdate.notFound.dialog.description':
      '条件に一致するレコードが見つかりませんでした',
    'desktop.bulkUpdate.error.dialog.title': 'エラーが発生しました',
    'desktop.bulkUpdate.error.dialog.description': '更新に失敗しました',
    'desktop.validation.error.targetFieldCode': '更新対象となるフィールドが存在しません。',
    'desktop.validation.error.basisFieldCode': '計算の基準となるフィールドが存在しません。',
    'desktop.validation.error.targetFieldCode.invalid':
      '更新対象となるフィールドが日付フィールドではありません。',
    'desktop.validation.error.basisFieldCode.invalid': '計算の基準となるフィールドの値が不正です。',
  },
  en: {
    'config.condition.targetFieldCode.title': 'Target Field',
    'config.condition.targetFieldCode.description':
      'Specify the field to be controlled by the plugin.',
    'config.condition.targetFieldCode.label': 'Target Field',
    'config.condition.targetFieldCode.placeholder': 'Field Name (Field Code)',
    'config.condition.isTargetFieldDisabled.label': 'Prohibit direct editing of the field',
    'config.condition.basisType.title': 'Reference Date',
    'config.condition.basisType.description':
      'Specify the reference date. Choose whether to base it on the current date or the value of a field.',
    'config.condition.basisFieldCode.title': 'Reference Field',
    'config.condition.basisFieldCode.description':
      'Specify the field to be used as the reference. The reference date will be the value of this field. You can also set a single-line text field, but if the format is not appropriate for a date, it will result in an error.',
    'config.condition.basisFieldCode.label': 'Reference Field',
    'config.condition.adjustments.title': 'Date Control',
    'config.condition.adjustments.description':
      'Set how to add or subtract from the reference date',
    'config.condition.bulkUpdate.title': 'Bulk Update',
    'config.condition.bulkUpdate.description':
      'You can bulk update records that match the search criteria in the list. When enabled, a bulk update button will be displayed in the list.',
    'config.condition.isBulkUpdateButtonVisible.label': 'Show Bulk Update Button',
    'config.condition.isBulkUpdateButtonVisibleForSpecificEntities.label':
      'Control which users can see the bulk update button',
    'config.sidebar.tab.label': 'Settings',
    'config.button.save': 'Save Settings',
    'config.button.return': 'Return to Plugin List',
    'config.toast.save': 'Settings saved',
    'config.toast.reset': 'Settings reset',
    'config.toast.import': 'Settings imported',
    'config.toast.export': 'Plugin settings exported',
    'config.error.root':
      'No root element found in the plugin HTML. An element with id="settings" is required to render the plugin settings.',
    'config.error.import': 'Failed to import settings. Please check the file for errors.',
    'config.error.export': 'Failed to export plugin settings. Please contact the plugin developer.',

    'desktop.bulkUpdate.dialog.title': 'Bulk Update',
    'desktop.bulkUpdate.dialog.description':
      'Update all records that match the current list search criteria. Are you sure?',
    'desktop.bulkUpdate.loading.label.get': 'Retrieving target records',
    'desktop.bulkUpdate.loading.label.update': 'Updating records',
    'desktop.bulkUpdate.success.dialog.title': 'Update Complete',
    'desktop.bulkUpdate.success.dialog.description': 'records updated',
    'desktop.bulkUpdate.notFound.dialog.title': 'No Update Targets Found',
    'desktop.bulkUpdate.notFound.dialog.description': 'No records matching the criteria were found',
    'desktop.bulkUpdate.error.dialog.title': 'An Error Occurred',
    'desktop.bulkUpdate.error.dialog.description': 'Failed to update',
    'desktop.validation.error.targetFieldCode': 'The target field for the update does not exist.',
    'desktop.validation.error.basisFieldCode':
      'The reference field for the calculation does not exist.',
    'desktop.validation.error.targetFieldCode.invalid':
      'The target field for the update is not a date field.',
    'desktop.validation.error.basisFieldCode.invalid':
      'The value of the reference field for the calculation is invalid.',
  },
  es: {
    'config.condition.targetFieldCode.title': 'Campo objetivo',
    'config.condition.targetFieldCode.description':
      'Especifique el campo que será controlado por el plugin.',
    'config.condition.targetFieldCode.label': 'Campo objetivo',
    'config.condition.targetFieldCode.placeholder': 'Nombre del campo (código del campo)',
    'config.condition.isTargetFieldDisabled.label': 'Prohibir la edición directa del campo',
    'config.condition.basisType.title': 'Fecha de referencia',
    'config.condition.basisType.description':
      'Especifique la fecha de referencia. Puede elegir entre la fecha actual o el valor de un campo.',
    'config.condition.basisFieldCode.title': 'Campo de referencia',
    'config.condition.basisFieldCode.description':
      'Especifique el campo que será la referencia. La fecha de referencia será el valor de este campo. También puede configurar un campo de texto de una sola línea, pero si el formato de la fecha no es adecuado, se producirá un error.',
    'config.condition.basisFieldCode.label': 'Campo de referencia',
    'config.condition.adjustments.title': 'Control de fecha',
    'config.condition.adjustments.description':
      'Configure cómo sumar o restar días a la fecha de referencia',
    'config.condition.bulkUpdate.title': 'Actualización masiva',
    'config.condition.bulkUpdate.description':
      'Puede actualizar en masa los registros que coincidan con los criterios de búsqueda de la lista. Si habilita esta configuración, se mostrará un botón de actualización masiva en la lista.',
    'config.condition.isBulkUpdateButtonVisible.label': 'Mostrar botón de actualización masiva',
    'config.condition.isBulkUpdateButtonVisibleForSpecificEntities.label':
      'Controlar los usuarios que pueden ver el botón de actualización masiva',
    'config.sidebar.tab.label': 'Configuración',
    'config.button.save': 'Guardar configuración',
    'config.button.return': 'Volver a la lista de plugins',
    'config.toast.save': 'Configuración guardada',
    'config.toast.reset': 'Configuración restablecida',
    'config.toast.import': 'Información de configuración importada',
    'config.toast.export': 'Información de configuración del plugin exportada',
    'config.error.root':
      'No hay un elemento raíz en el HTML del plugin. Se necesita un elemento con id="settings" para renderizar la configuración del plugin.',
    'config.error.import':
      'Error al importar la información de configuración, verifique que el archivo no tenga errores',
    'config.error.export':
      'Error al exportar la información de configuración del plugin. Contacte al desarrollador del plugin.',

    'desktop.bulkUpdate.dialog.title': 'Actualización masiva',
    'desktop.bulkUpdate.dialog.description':
      'Actualizará todos los registros que coincidan con los criterios de búsqueda actuales de la lista. ¿Está seguro?',
    'desktop.bulkUpdate.loading.label.get': 'Obteniendo registros objetivo',
    'desktop.bulkUpdate.loading.label.update': 'Actualizando registros',
    'desktop.bulkUpdate.success.dialog.title': 'Actualización completada',
    'desktop.bulkUpdate.success.dialog.description': 'registros actualizados',
    'desktop.bulkUpdate.notFound.dialog.title': 'No se encontraron registros para actualizar',
    'desktop.bulkUpdate.notFound.dialog.description':
      'No se encontraron registros que coincidan con los criterios',
    'desktop.bulkUpdate.error.dialog.title': 'Se produjo un error',
    'desktop.bulkUpdate.error.dialog.description': 'Error al actualizar',
    'desktop.validation.error.targetFieldCode':
      'El campo objetivo para la actualización no existe.',
    'desktop.validation.error.basisFieldCode': 'El campo de referencia para el cálculo no existe.',
    'desktop.validation.error.targetFieldCode.invalid':
      'El campo objetivo para la actualización no es un campo de fecha.',
    'desktop.validation.error.basisFieldCode.invalid':
      'El valor del campo de referencia es inválido.',
  },
  zh: {
    'config.condition.targetFieldCode.title': '目标字段',
    'config.condition.targetFieldCode.description': '请指定由插件控制的目标字段。',
    'config.condition.targetFieldCode.label': '目标字段',
    'config.condition.targetFieldCode.placeholder': '字段名（字段代码）',
    'config.condition.isTargetFieldDisabled.label': '禁止直接编辑字段',
    'config.condition.basisType.title': '基准日期',
    'config.condition.basisType.description':
      '请指定基准日期。选择以当前日期为基准或以字段值为基准。',
    'config.condition.basisFieldCode.title': '基准字段',
    'config.condition.basisFieldCode.description':
      '请指定基准字段。基准日期将是字段的值。您也可以设置单行文本字段，但如果格式不正确，将会出错。',
    'config.condition.basisFieldCode.label': '基准字段',
    'config.condition.adjustments.title': '日期控制',
    'config.condition.adjustments.description': '设置从基准日期加减的方法',
    'config.condition.bulkUpdate.title': '批量更新',
    'config.condition.bulkUpdate.description':
      '可以批量更新符合列表搜索条件的记录。启用设置后，将在列表中显示批量更新按钮。',
    'config.condition.isBulkUpdateButtonVisible.label': '显示批量更新按钮',
    'config.condition.isBulkUpdateButtonVisibleForSpecificEntities.label':
      '控制显示批量更新按钮的用户',
    'config.sidebar.tab.label': '设置',
    'config.button.save': '保存设置',
    'config.button.return': '返回插件列表',
    'config.toast.save': '设置已保存',
    'config.toast.reset': '设置已重置',
    'config.toast.import': '设置信息已导入',
    'config.toast.export': '插件设置信息已导出',
    'config.error.root': '插件的HTML中不存在根元素。要渲染插件设置，需要一个id="settings"的元素。',
    'config.error.import': '导入设置信息失败，请检查文件是否有误',
    'config.error.export': '导出插件设置信息失败。请联系插件开发者。',

    'desktop.bulkUpdate.dialog.title': '批量更新',
    'desktop.bulkUpdate.dialog.description': '将更新当前列表搜索条件下的所有记录。确定吗？',
    'desktop.bulkUpdate.loading.label.get': '正在获取目标记录',
    'desktop.bulkUpdate.loading.label.update': '正在更新记录',
    'desktop.bulkUpdate.success.dialog.title': '更新完成',
    'desktop.bulkUpdate.success.dialog.description': '条记录已更新',
    'desktop.bulkUpdate.notFound.dialog.title': '未找到更新目标',
    'desktop.bulkUpdate.notFound.dialog.description': '未找到符合条件的记录',
    'desktop.bulkUpdate.error.dialog.title': '发生错误',
    'desktop.bulkUpdate.error.dialog.description': '更新失败',
    'desktop.validation.error.targetFieldCode': '不存在更新目标字段。',
    'desktop.validation.error.basisFieldCode': '不存在计算基准字段。',
    'desktop.validation.error.targetFieldCode.invalid': '更新目标字段不是日期字段。',
    'desktop.validation.error.basisFieldCode.invalid': '计算基准字段的值无效。',
  },
  'zh-TW': {},
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});

export const getMUITheme = () => {
  return createTheme(
    {},
    LANGUAGE === 'en' ? enUS : LANGUAGE === 'zh' ? zhCN : LANGUAGE === 'es' ? esES : jaJP
  );
};
