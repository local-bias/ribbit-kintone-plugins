import * as Encoding from 'encoding-japanese';
import type { EncodingOption } from './types';

/** EncodingOption から encoding-japanese の文字コード名へのマッピング */
const ENCODING_MAP: Record<Exclude<EncodingOption, 'AUTO'>, Encoding.Encoding> = {
  UTF8: 'UTF8',
  SJIS: 'SJIS',
  EUCJP: 'EUCJP',
};

/** 検出された文字コードの表示用ラベル */
const ENCODING_LABELS: Partial<Record<Encoding.Encoding, string>> = {
  UTF8: 'UTF-8',
  SJIS: 'Shift_JIS',
  EUCJP: 'EUC-JP',
  JIS: 'JIS',
  UNICODE: 'UTF-16',
  UTF16: 'UTF-16',
  ASCII: 'ASCII',
};

/** デコード結果 */
export interface DecodeResult {
  /** デコードされた文字列 */
  text: string;
  /** 自動検出された文字コード（表示用ラベル） */
  detectedLabel: string;
}

/**
 * バイト列から文字コードを自動検出します。検出に失敗した場合は UTF-8 とみなします。
 */
function detectEncoding(bytes: Uint8Array): Encoding.Encoding {
  const detected = Encoding.detect(bytes);
  return detected || 'UTF8';
}

/**
 * CSVファイルのバイト列を、指定された文字コード（AUTOの場合は自動検出）で
 * Unicode文字列へデコードします。
 */
export function decodeCsvBytes(bytes: Uint8Array, option: EncodingOption): DecodeResult {
  const detected = detectEncoding(bytes);
  const from = option === 'AUTO' ? detected : ENCODING_MAP[option];

  const text = Encoding.convert(bytes, {
    to: 'UNICODE',
    from,
    type: 'string',
  });

  // 先頭のBOM（UTF-8 BOM）が残る場合があるため除去する
  const normalized = text.replace(/^﻿/, '');

  return {
    text: normalized,
    detectedLabel: ENCODING_LABELS[detected] ?? detected,
  };
}
