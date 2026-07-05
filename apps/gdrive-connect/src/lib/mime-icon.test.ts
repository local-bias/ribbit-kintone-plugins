import { describe, expect, it } from 'vitest';
import { getIconCategory } from './mime-icon';

describe('getIconCategory', () => {
  it('Googleドライブのフォルダをfolderと判定する', () => {
    expect(getIconCategory('application/vnd.google-apps.folder')).toBe('folder');
  });

  it('画像系MIMEタイプをimageと判定する', () => {
    expect(getIconCategory('image/png')).toBe('image');
    expect(getIconCategory('image/jpeg')).toBe('image');
  });

  it('PDFをpdfと判定する', () => {
    expect(getIconCategory('application/pdf')).toBe('pdf');
  });

  it('スプレッドシート系(Googleスプレッドシート・Excel)をspreadsheetと判定する', () => {
    expect(getIconCategory('application/vnd.google-apps.spreadsheet')).toBe('spreadsheet');
    expect(
      getIconCategory('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    ).toBe('spreadsheet');
  });

  it('プレゼンテーション系(Googleスライド・PowerPoint)をpresentationと判定する', () => {
    expect(getIconCategory('application/vnd.google-apps.presentation')).toBe('presentation');
    expect(getIconCategory('application/vnd.ms-powerpoint')).toBe('presentation');
  });

  it('ドキュメント系(Googleドキュメント・Word・テキスト)をdocumentと判定する', () => {
    expect(getIconCategory('application/vnd.google-apps.document')).toBe('document');
    expect(getIconCategory('text/plain')).toBe('document');
  });

  it('圧縮ファイルをarchiveと判定する', () => {
    expect(getIconCategory('application/zip')).toBe('archive');
  });

  it('動画・音声をそれぞれvideo・audioと判定する', () => {
    expect(getIconCategory('video/mp4')).toBe('video');
    expect(getIconCategory('audio/mpeg')).toBe('audio');
  });

  it('未知のMIMEタイプはotherと判定する', () => {
    expect(getIconCategory('application/x-unknown-type')).toBe('other');
  });
});
