import { createTheme } from '@mui/material';
import { LANGUAGE } from './global';
import { enUS, esES, jaJP, zhCN } from '@mui/material/locale';

export const ui = {
  ja: {
    'config.condition.targetFieldCode.title': '対象フィールド',
    'config.condition.targetFieldCode.description':
      '自動補完を有効にするフィールドを選択してください',
    'config.condition.targetFieldCode.label': '対象フィールド',
    'config.condition.srcAppId.title': '参照するアプリ',
    'config.condition.srcAppId.description': '自動補完の候補として参照するアプリを選択してください',
    'config.condition.srcAppId.label': '参照アプリ',
    'config.condition.srcFieldCode.title': '参照するフィールド',
    'config.condition.srcFieldCode.description':
      '自動補完の候補として参照するフィールドを選択してください',
    'config.condition.srcFieldCode.label': '参照フィールド',
    'config.condition.limit.title': '表示上限',
    'config.condition.limit.description':
      '表示する候補の上限を設定します。参照するデータ件数が多すぎるとパフォーマンスに影響しますが、上限を設定することで解決することがあります。あくまで表示されるデータの上限のため、検索は全てのデータに対して実行されます。0を指定した場合、上限は設定されません。',

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
    'desktop.dialogtrigger.title': 'プラグインが有効です',
    'desktop.dialogtrigger.content': 'クリックするとイベントの詳細を確認できます',
    'desktop.dialog.title': 'プラグインの設定情報',
  },
  en: {
    'config.condition.targetFieldCode.title': 'Target Field',
    'config.condition.targetFieldCode.description': 'Select the field to enable autocomplete',
    'config.condition.targetFieldCode.label': 'Target Field',
    'config.condition.srcAppId.title': 'Source App',
    'config.condition.srcAppId.description':
      'Select the app to reference for autocomplete suggestions',
    'config.condition.srcAppId.label': 'Source App',
    'config.condition.srcFieldCode.title': 'Source Field',
    'config.condition.srcFieldCode.description':
      'Select the field to reference for autocomplete suggestions',
    'config.condition.srcFieldCode.label': 'Source Field',
    'config.condition.limit.title': 'Display Limit',
    'config.condition.limit.description':
      'Set the limit for displaying suggestions. If the number of data to reference is too large, it may affect performance, but setting a limit can help resolve this. This limit only affects the displayed data, and the search will still be performed on all data. If you specify 0, there will be no limit.',

    'config.sidebar.tab.label': 'Settings',
    'config.button.save': 'Save Settings',
    'config.button.return': 'Return to Plugin List',
    'config.toast.save': 'Settings saved',
    'config.toast.reset': 'Settings reset',
    'config.toast.import': 'Settings imported',
    'config.toast.export': 'Plugin settings exported',
    'config.error.root':
      'The root element does not exist in the plugin HTML. To render the plugin settings, an element with id="settings" is required.',
    'config.error.import': 'Failed to import settings. Please check the file for errors.',
    'config.error.export': 'Failed to export plugin settings. Please contact the plugin developer.',
    'desktop.dialogtrigger.title': 'Plugin is enabled',
    'desktop.dialogtrigger.content': 'Click to view event details',
    'desktop.dialog.title': 'Plugin Settings',
  },
  zh: {
    'config.condition.targetFieldCode.title': '目标字段',
    'config.condition.targetFieldCode.description': '请选择要启用自动完成的字段',
    'config.condition.targetFieldCode.label': '目标字段',
    'config.condition.srcAppId.title': '参考应用',
    'config.condition.srcAppId.description': '请选择用于自动完成建议的参考应用',
    'config.condition.srcAppId.label': '参考应用',
    'config.condition.srcFieldCode.title': '参考字段',
    'config.condition.srcFieldCode.description': '请选择用于自动完成建议的参考字段',
    'config.condition.srcFieldCode.label': '参考字段',
    'config.condition.limit.title': '显示限制',
    'config.condition.limit.description':
      '设置显示建议的限制。如果要参考的数据数量过大，可能会影响性能，但设置限制可以解决此问题。此限制仅影响显示的数据，搜索仍将在所有数据上执行。如果指定为0，则没有限制。',

    'config.sidebar.tab.label': '设置',
    'config.button.save': '保存设置',
    'config.button.return': '返回插件列表',
    'config.toast.save': '设置已保存',
    'config.toast.reset': '设置已重置',
    'config.toast.import': '已导入设置',
    'config.toast.export': '已导出插件设置',
    'config.error.root': '插件的HTML中不存在根元素。要渲染插件设置，需要一个id="settings"的元素。',
    'config.error.import': '导入设置失败。请检查文件是否有错误。',
    'config.error.export': '导出插件设置失败。请联系插件开发者。',
    'desktop.dialogtrigger.title': '插件已启用',
    'desktop.dialogtrigger.content': '单击以查看事件详细信息',
    'desktop.dialog.title': '插件设置',
  },
  "zh-TW": {
    'config.condition.targetFieldCode.title': '目標欄位',
    'config.condition.targetFieldCode.description': '請選擇要啟用自動完成的欄位',
    'config.condition.targetFieldCode.label': '目標欄位',
    'config.condition.srcAppId.title': '參考的應用程式',
    'config.condition.srcAppId.description': '請選擇作為自動完成候選的參考應用程式',
    'config.condition.srcAppId.label': '參考應用程式',
    'config.condition.srcFieldCode.title': '參考的欄位',
    'config.condition.srcFieldCode.description': '請選擇作為自動完成候選的參考欄位',
    'config.condition.srcFieldCode.label': '參考欄位',
    'config.condition.limit.title': '顯示上限',
    'config.condition.limit.description':
      '設定顯示候選項目的上限。若參考的資料量過大可能影響效能，但設定上限可改善此問題。此上限僅影響顯示的資料，搜尋仍會對所有資料執行。若指定為 0，則不設上限。',

    'config.sidebar.tab.label': '設定',
    'config.button.save': '儲存設定',
    'config.button.return': '返回外掛清單',
    'config.toast.save': '已儲存設定',
    'config.toast.reset': '已重設設定',
    'config.toast.import': '已匯入設定',
    'config.toast.export': '已匯出外掛設定',
    'config.error.root':
      '外掛的 HTML 中不存在根元素。要呈現外掛設定，需要一個 id="settings" 的元素。',
    'config.error.import': '匯入設定失敗。請確認檔案是否正確。',
    'config.error.export': '匯出外掛設定失敗。請聯絡外掛開發者。',
    'desktop.dialogtrigger.title': '外掛已啟用',
    'desktop.dialogtrigger.content': '點擊以查看事件詳細資訊',
    'desktop.dialog.title': '外掛設定',
  },
  es: {
    'config.condition.targetFieldCode.title': 'Campo de destino',
    'config.condition.targetFieldCode.description':
      'Seleccione el campo para habilitar el autocompletado',
    'config.condition.targetFieldCode.label': 'Campo de destino',
    'config.condition.srcAppId.title': 'Aplicación de origen',
    'config.condition.srcAppId.description':
      'Seleccione la aplicación de referencia para las sugerencias de autocompletado',
    'config.condition.srcAppId.label': 'Aplicación de origen',
    'config.condition.srcFieldCode.title': 'Campo de origen',
    'config.condition.srcFieldCode.description':
      'Seleccione el campo de referencia para las sugerencias de autocompletado',
    'config.condition.srcFieldCode.label': 'Campo de origen',
    'config.condition.limit.title': 'Límite de visualización',
    'config.condition.limit.description':
      'Establezca el límite para mostrar sugerencias. Si el número de datos a referenciar es demasiado grande, puede afectar el rendimiento, pero establecer un límite puede ayudar a resolver esto. Este límite solo afecta los datos mostrados y la búsqueda se realizará en todos los datos. Si especifica 0, no habrá límite.',

    'config.sidebar.tab.label': 'Configuración',
    'config.button.save': 'Guardar configuración',
    'config.button.return': 'Volver a la lista de plugins',
    'config.toast.save': 'Configuración guardada',
    'config.toast.reset': 'Configuración restablecida',
    'config.toast.import': 'Configuración importada',
    'config.toast.export': 'Configuración del plugin exportada',
    'config.error.root':
      'El elemento raíz no existe en el HTML del plugin. Para renderizar la configuración del plugin, se requiere un elemento con id="settings".',
    'config.error.import':
      'Error al importar la configuración. Por favor, verifique que el archivo no contenga errores.',
    'config.error.export':
      'Error al exportar la configuración del plugin. Por favor, contacte al desarrollador del plugin.',
    'desktop.dialogtrigger.title': 'El plugin está habilitado',
    'desktop.dialogtrigger.content': 'Haz clic para ver los detalles del evento',
    'desktop.dialog.title': 'Configuración del plugin',
  },
  "pt-BR": {
    'config.condition.targetFieldCode.title': 'Campo de destino',
    'config.condition.targetFieldCode.description':
      'Selecione o campo para habilitar o preenchimento automático',
    'config.condition.targetFieldCode.label': 'Campo de destino',
    'config.condition.srcAppId.title': 'Aplicativo de origem',
    'config.condition.srcAppId.description':
      'Selecione o aplicativo a ser usado como referência para as sugestões de preenchimento automático',
    'config.condition.srcAppId.label': 'Aplicativo de origem',
    'config.condition.srcFieldCode.title': 'Campo de origem',
    'config.condition.srcFieldCode.description':
      'Selecione o campo a ser usado como referência para as sugestões de preenchimento automático',
    'config.condition.srcFieldCode.label': 'Campo de origem',
    'config.condition.limit.title': 'Limite de exibição',
    'config.condition.limit.description':
      'Defina o limite para exibir sugestões. Se a quantidade de dados de referência for muito grande, o desempenho pode ser afetado, mas definir um limite pode ajudar a resolver. Esse limite afeta apenas os dados exibidos; a busca ainda será executada sobre todos os dados. Se você especificar 0, não haverá limite.',

    'config.sidebar.tab.label': 'Configurações',
    'config.button.save': 'Salvar configurações',
    'config.button.return': 'Voltar à lista de plugins',
    'config.toast.save': 'Configurações salvas',
    'config.toast.reset': 'Configurações redefinidas',
    'config.toast.import': 'Configurações importadas',
    'config.toast.export': 'Configurações do plugin exportadas',
    'config.error.root':
      'O elemento raiz não existe no HTML do plugin. Para renderizar as configurações do plugin, é necessário um elemento com id="settings".',
    'config.error.import': 'Falha ao importar as configurações. Verifique se o arquivo está correto.',
    'config.error.export':
      'Falha ao exportar as configurações do plugin. Entre em contato com o desenvolvedor do plugin.',
    'desktop.dialogtrigger.title': 'Plugin habilitado',
    'desktop.dialogtrigger.content': 'Clique para ver os detalhes do evento',
    'desktop.dialog.title': 'Configurações do plugin',
  },
  th: {
    'config.condition.targetFieldCode.title': 'ฟิลด์เป้าหมาย',
    'config.condition.targetFieldCode.description':
      'โปรดเลือกฟิลด์ที่ต้องการเปิดใช้งานการเติมข้อความอัตโนมัติ',
    'config.condition.targetFieldCode.label': 'ฟิลด์เป้าหมาย',
    'config.condition.srcAppId.title': 'แอปที่อ้างอิง',
    'config.condition.srcAppId.description':
      'โปรดเลือกแอปที่จะใช้เป็นข้อมูลอ้างอิงสำหรับตัวเลือกการเติมข้อความอัตโนมัติ',
    'config.condition.srcAppId.label': 'แอปที่อ้างอิง',
    'config.condition.srcFieldCode.title': 'ฟิลด์ที่อ้างอิง',
    'config.condition.srcFieldCode.description':
      'โปรดเลือกฟิลด์ที่จะใช้เป็นข้อมูลอ้างอิงสำหรับตัวเลือกการเติมข้อความอัตโนมัติ',
    'config.condition.srcFieldCode.label': 'ฟิลด์ที่อ้างอิง',
    'config.condition.limit.title': 'ขีดจำกัดการแสดงผล',
    'config.condition.limit.description':
      'กำหนดจำนวนสูงสุดของรายการแนะนำที่จะแสดง หากปริมาณข้อมูลที่อ้างอิงมีจำนวนมากอาจส่งผลต่อประสิทธิภาพ แต่การกำหนดขีดจำกัดสามารถช่วยได้ ขีดจำกัดนี้มีผลเฉพาะข้อมูลที่แสดงเท่านั้น การค้นหายังคงดำเนินการกับข้อมูลทั้งหมด หากระบุเป็น 0 จะไม่จำกัด',

    'config.sidebar.tab.label': 'การตั้งค่า',
    'config.button.save': 'บันทึกการตั้งค่า',
    'config.button.return': 'กลับไปยังรายการปลั๊กอิน',
    'config.toast.save': 'บันทึกการตั้งค่าแล้ว',
    'config.toast.reset': 'รีเซ็ตการตั้งค่าแล้ว',
    'config.toast.import': 'นำเข้าการตั้งค่าแล้ว',
    'config.toast.export': 'ส่งออกการตั้งค่าปลั๊กอินแล้ว',
    'config.error.root':
      'ไม่พบองค์ประกอบรากใน HTML ของปลั๊กอิน หากต้องการเรนเดอร์หน้าการตั้งค่าปลั๊กอิน จำเป็นต้องมีองค์ประกอบที่มี id="settings"',
    'config.error.import': 'ไม่สามารถนำเข้าการตั้งค่า โปรดตรวจสอบความถูกต้องของไฟล์',
    'config.error.export': 'ไม่สามารถส่งออกการตั้งค่าปลั๊กอิน โปรดติดต่อผู้พัฒนาปลั๊กอิน',
    'desktop.dialogtrigger.title': 'ปลั๊กอินถูกเปิดใช้งาน',
    'desktop.dialogtrigger.content': 'คลิกเพื่อดูรายละเอียดของเหตุการณ์',
    'desktop.dialog.title': 'การตั้งค่าปลั๊กอิน',
  }

} as const;

export type Language = keyof typeof ui;

export const defaultLang = 'ja' satisfies Language;

/**
 * 指定された言語に対応する翻訳関数を返します。
 * @param lang - 言語のキー
 * @returns 指定された言語に対応する翻訳関数
 */
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]): string {
    //@ts-ignore
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

export const t = useTranslations(LANGUAGE as Language);

export const getMUITheme = () => {
  return createTheme(
    {},
    LANGUAGE === 'en' ? enUS : LANGUAGE === 'zh' ? zhCN : LANGUAGE === 'es' ? esES : jaJP
  );
};
