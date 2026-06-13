import type { TargetEvent } from '@/schema/plugin-config';

/** インポート方法 */
export type ImportMode =
  | 'add' // レコードの追加のみ
  | 'upsert' // レコードの更新と追加
  | 'update'; // レコードの更新のみ

/** エラー発生時の挙動 */
export type ErrorBehavior =
  | 'abort' // エラーがある場合は取り込みを中断する
  | 'skip'; // エラー行を除いて取り込む

/** 文字コードの指定 */
export type EncodingOption =
  | 'AUTO' // 自動検出
  | 'UTF8'
  | 'SJIS'
  | 'EUCJP';

/** 区切り文字の指定 */
export type DelimiterOption =
  | 'comma' // カンマ区切り
  | 'tab'; // タブ区切り

/** CSVインポートの設定値 */
export interface ImportSettings {
  /** 文字コード */
  encoding: EncodingOption;
  /** 区切り文字 */
  delimiter: DelimiterOption;
  /** インポート方法 */
  mode: ImportMode;
  /** 更新キーとなるフィールドコード（追加のみの場合は未使用） */
  updateKeyField: string;
  /** エラー発生時の挙動 */
  errorBehavior: ErrorBehavior;
}

/** 更新キーに指定可能なフィールドの候補 */
export interface UpdateKeyCandidate {
  code: string;
  label: string;
}

/** マッピング先に指定可能なフィールド */
export interface ImportableField {
  code: string;
  label: string;
  type: string;
}

/**
 * CSVの各列とkintoneフィールドの対応。
 * 配列のインデックスがCSVの列番号に対応し、値が割り当てるフィールドコード
 * （空文字列は「取り込まない」を表す）。
 */
export type ColumnMapping = string[];

/** プレビューに表示するデータ行数 */
export const PREVIEW_ROW_COUNT = 5;

/** デフォルトのインポート設定 */
export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  encoding: 'AUTO',
  delimiter: 'comma',
  mode: 'add',
  updateKeyField: '',
  errorBehavior: 'abort',
};

/**
 * インポート方法に対応する、入力チェックの対象画面を返します。
 * - 追加 → 新規作成（create）のルール
 * - 更新 → 編集（edit）のルール
 * - 更新と追加 → 両方のルール
 */
export function getValidationEventsForMode(mode: ImportMode): TargetEvent[] {
  switch (mode) {
    case 'add':
      return ['create'];
    case 'update':
      return ['edit'];
    case 'upsert':
      return ['create', 'edit'];
    default:
      return ['create'];
  }
}
