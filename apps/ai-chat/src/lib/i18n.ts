import type { WebSearchTool } from 'openai/resources/responses/responses.mjs';
import { mergeDeep } from 'remeda';
import { LANGUAGE } from './global';
import { commonUi, useTranslations } from './w-i18n';

// Since the i18n structure is dynamic and types are inferred, we'll manually add the missing keys for now or rely on the fact that t() accepts string keys.
// However, the previous tool call referenced t('factCheck.label') which suggests I need to add these keys to the `ui` object in this file.

const ui = mergeDeep(commonUi, {
  ja: {
    'common.auth.serverError': 'サーバーエラーが発生しました。管理者へお問い合わせください。',
    'common.auth.licenseExpired': 'ライセンスの有効期限が切れています。',
    'common.auth.licenseInvalid': 'ライセンスが無効です',
    'factCheck.label': 'ファクトチェック',
    'factCheck.enable': 'ファクトチェックを有効にする',
    'factCheck.enable.custom':
      'AIの回答をファクトチェックAIに渡して、ウェブ上の情報を照らし合わせて検証します。ユーザーの正確性判断を補助することができますが、回答の正確性を保証するものではありません。ファクトチェックのため、追加のトークンが消費されます。',
    'factCheck.enableLog': 'ファクトチェック結果をログに記録する',
    'factCheck.enableLog.description':
      '検証結果をログアプリに保存します（保存用フィールドの設定が必要です）',
    'factCheck.status.checking': 'ファクトチェック中...',
    'factCheck.status.trusted': 'ウェブ上の情報と一致',
    'factCheck.status.caution': 'ウェブ上の情報と不一致',
    'factCheck.status.inaccurate': 'ウェブ上の情報と矛盾',
    'factCheck.status.error': 'ファクトチェックに失敗しました',
    'factCheck.status.skipped': 'ファクトチェックは実行されませんでした',
    'factCheck.verification.claim': '検証対象',
    'factCheck.verification.verdict': '判定',
    'factCheck.verification.explanation': '理由',
    'factCheck.verification.sources': '情報源',
    'factCheck.verification.correction': '修正情報',
    'htmlOutput.label': 'HTML出力',
    'htmlOutput.enable': 'HTML出力を有効にする',
    'htmlOutput.enable.description':
      'AIがHTMLを生成した場合、画面を分割してプレビュー表示できるようになります。',
    'htmlOutput.preview.title': 'プレビュー',
    'htmlOutput.preview.close': '閉じる',
    'htmlOutput.preview.viewPreview': 'プレビュー',
    'htmlOutput.preview.viewSource': 'ソース',
    'htmlOutput.preview.print': '印刷',
    'htmlOutput.preview.show': 'プレビューを表示',
  },
  en: {
    'factCheck.label': 'Fact Check',
    'factCheck.enable': 'Enable Fact Check',
    'factCheck.enable.custom': 'Verify AI responses against web sources',
    'factCheck.enableLog': 'Log Fact Check Results',
    'factCheck.enableLog.description': 'Save verification results to the log app',
    'factCheck.status.checking': 'Checking...',
    'factCheck.status.trusted': 'Trusted',
    'factCheck.status.caution': 'Caution',
    'factCheck.status.inaccurate': 'Inaccurate',
    'factCheck.status.error': 'Fact check failed',
    'factCheck.status.skipped': 'Fact check was not performed',
    'factCheck.verification.claim': 'Claim',
    'factCheck.verification.verdict': 'Verdict',
    'factCheck.verification.explanation': 'Explanation',
    'factCheck.verification.sources': 'Sources',
    'factCheck.verification.correction': 'Correction',
    'htmlOutput.label': 'HTML Output',
    'htmlOutput.enable': 'Enable HTML Output',
    'htmlOutput.enable.description':
      'When AI generates HTML, the screen will split to show a preview.',
    'htmlOutput.preview.title': 'HTML Preview',
    'htmlOutput.preview.close': 'Close',
    'htmlOutput.preview.viewPreview': 'Preview',
    'htmlOutput.preview.viewSource': 'Source',
    'htmlOutput.preview.print': 'Print',
    'htmlOutput.preview.show': 'Show Preview',
  },
  es: {},
  zh: {},
  'zh-TW': {},
} as const);

export const t = useTranslations({
  ui,
  lang: LANGUAGE as keyof typeof ui,
  defaultLang: 'ja',
});

export function getWebSearchLocation(): WebSearchTool['user_location'] {
  switch (LANGUAGE) {
    case 'en':
      return {
        type: 'approximate',
        country: 'US',
        city: 'New York',
        region: 'New York',
      };
    case 'es':
      return {
        type: 'approximate',
        country: 'ES',
        city: 'Madrid',
        region: 'Madrid',
      };
    case 'zh':
    case 'zh-TW':
      return {
        type: 'approximate',
        country: 'CN',
        city: 'Beijing',
        region: 'Beijing',
      };
    case 'ja':
    default:
      return {
        type: 'approximate',
        country: 'JP',
        city: 'Tokyo',
        region: 'Tokyo',
      };
  }
}
