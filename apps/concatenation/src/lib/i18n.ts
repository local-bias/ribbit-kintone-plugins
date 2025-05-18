import { commonUi, useTranslations } from '@repo/utils';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';

const ui = mergeDeep(commonUi, {
  ja: {
    'config.targetField.title': '対象フィールド',
    'config.targetField.description': '結合した結果を格納するフィールドを選択してください。',
    'config.concatenationItems.title': '結合設定',
  },
  en: {
    'config.targetField.title': 'Target Field',
    'config.targetField.description': 'Please select the field to store the concatenated result.',
  },
  es: {
    'config.targetField.title': 'Campo objetivo',
    'config.targetField.description':
      'Seleccione el campo para almacenar el resultado concatenado.',
  },
  zh: {
    'config.targetField.title': '目标字段',
    'config.targetField.description': '请选择用于存储合并结果的字段。',
  },
  'zh-TW': {
    'config.targetField.title': '目標欄位',
    'config.targetField.description': '請選擇用於存儲合併結果的欄位。',
  },
  'pt-BR': {
    'config.targetField.title': 'Campo de Destino',
    'config.targetField.description': 'Selecione o campo para armazenar o resultado concatenado.',
  },
  th: {
    'config.targetField.title': 'ฟิลด์เป้าหมาย',
    'config.targetField.description': 'โปรดเลือกฟิลด์เพื่อจัดเก็บผลลัพธ์ที่รวมกัน',
  },
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});
