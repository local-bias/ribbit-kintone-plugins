import { commonUi, useTranslations } from '@repo/utils';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';

const ui = mergeDeep(commonUi, {
  ja: {
    'common.autocomplete.options.appName': 'App: {0}',
    'common.autocomplete.options.fieldCode': 'Code: {0}',

    'config.fields.label': 'フィールド',
    'config.fields.dstFieldCode.label': 'コピー先フィールド',
    'config.fields.srcFieldCode.label': 'コピー元フィールド',
    'config.fields.tooltip.add': 'フィールドを追加',
    'config.fields.tooltip.delete': 'フィールドを削除',
    'config.fields.type.label': 'コピータイプ',
    'config.fields.fixedValue.label': '設定する固定値',
    'config.dstAppId.label': 'コピー先アプリ',

    'config.fields.type.options.copy': 'フィールドの値をコピー',
    'config.fields.type.options.fixed': '固定値を設定',
    'config.fields.type.options.calc': '計算式で設定',

    'desktop.fieldError.unknownError': '入力値に誤りがあります',
    'desktop.fieldError.invalidFieldType': '自動入力されるフィールドを更新することはできません',
    'desktop.fieldError.invalidNumber':
      '参照元の値が数値ではないため、コピーは実行されませんでした',
    'desktop.fieldError.invalidDate':
      '参照元のフォーマットが適切でないため、コピーは実行されませんでした',
    'desktop.fieldError.invalidOption':
      '参照元の値が選択肢に含まれていないため、コピーは実行されませんでした',
  },
  en: {},
  es: {},
  zh: {},
  'zh-TW': {},
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});
