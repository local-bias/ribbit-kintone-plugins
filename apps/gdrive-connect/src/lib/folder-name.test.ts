import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, it } from 'vitest';
import { buildFolderName } from './folder-name';

const baseRecord = {
  $id: { type: 'RECORD_NUMBER', value: '42' },
} as unknown as kintoneAPI.RecordData;

describe('buildFolderName', () => {
  it('レコード番号($id)を先頭に付与する', () => {
    const name = buildFolderName({ fieldCodes: [], record: baseRecord });
    expect(name).toBe('#42');
  });

  it('指定したフィールドの値をレコード番号の後ろに結合する', () => {
    const record = {
      ...baseRecord,
      title: { type: 'SINGLE_LINE_TEXT', value: '契約書' },
    } as unknown as kintoneAPI.RecordData;
    const name = buildFolderName({ fieldCodes: ['title'], record });
    expect(name).toBe('#42 契約書');
  });

  it('複数フィールドを指定した場合は順番通りに結合する', () => {
    const record = {
      ...baseRecord,
      lastName: { type: 'SINGLE_LINE_TEXT', value: '山田' },
      firstName: { type: 'SINGLE_LINE_TEXT', value: '太郎' },
    } as unknown as kintoneAPI.RecordData;
    const name = buildFolderName({ fieldCodes: ['lastName', 'firstName'], record });
    expect(name).toBe('#42 山田 太郎');
  });

  it('値が空のフィールドは除外する', () => {
    const record = {
      ...baseRecord,
      title: { type: 'SINGLE_LINE_TEXT', value: '' },
      subtitle: { type: 'SINGLE_LINE_TEXT', value: '概要' },
    } as unknown as kintoneAPI.RecordData;
    const name = buildFolderName({ fieldCodes: ['title', 'subtitle'], record });
    expect(name).toBe('#42 概要');
  });

  it('存在しないフィールドコードを指定しても例外を投げない', () => {
    const name = buildFolderName({ fieldCodes: ['missingField'], record: baseRecord });
    expect(name).toBe('#42');
  });

  it('$idが存在しない場合はフォールバック文字列を返す', () => {
    const record = {} as unknown as kintoneAPI.RecordData;
    const name = buildFolderName({ fieldCodes: [], record });
    expect(name).toBe('record');
  });

  it('複数選択などの配列値はカンマ区切りで結合する', () => {
    const record = {
      ...baseRecord,
      tags: {
        type: 'CHECK_BOX',
        value: [
          { code: 'a', name: 'A' },
          { code: 'b', name: 'B' },
        ],
      },
    } as unknown as kintoneAPI.RecordData;
    const name = buildFolderName({ fieldCodes: ['tags'], record });
    expect(name).toBe('#42 A,B');
  });
});
