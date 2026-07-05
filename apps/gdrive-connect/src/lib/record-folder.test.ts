import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, it, vi } from 'vitest';
import type { PluginCondition } from '@/schema/plugin-config';

vi.mock('@/lib/global', () => ({
  isDev: false,
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
  GUEST_SPACE_ID: undefined,
  LANGUAGE: 'ja',
}));

const createFolderMock = vi.fn();
const getFolderMock = vi.fn();
vi.mock('@/lib/drive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./drive')>();
  return {
    ...actual,
    createFolder: (...args: unknown[]) => createFolderMock(...args),
    getFolder: (...args: unknown[]) => getFolderMock(...args),
  };
});

import { assignExistingFolder, createRecordFolder, readFolderId } from './record-folder';

const baseCondition = {
  id: 'condition-1',
  memo: '',
  targetSpaceId: 'space-1',
  parentFolderId: 'parent-1',
  folderIdFieldCode: 'driveFolderId',
  folderNameFieldCodes: ['title'],
  folderCreationTrigger: 'onSave',
} as unknown as PluginCondition;

const baseRecord = {
  $id: { type: 'RECORD_NUMBER', value: '1' },
  title: { type: 'SINGLE_LINE_TEXT', value: '契約書' },
} as unknown as kintoneAPI.RecordData;

describe('createRecordFolder', () => {
  it('親フォルダIDが未設定の場合はエラーを投げる', async () => {
    const condition = { ...baseCondition, parentFolderId: '' };
    await expect(
      createRecordFolder({ accessToken: 'token', condition, record: baseRecord })
    ).rejects.toThrow('親フォルダID');
  });

  it('親フォルダの直下にフォルダ名を生成して作成する', async () => {
    createFolderMock.mockResolvedValueOnce({ id: 'created-folder-id' });
    const result = await createRecordFolder({
      accessToken: 'token',
      condition: baseCondition,
      record: baseRecord,
    });
    expect(result).toEqual({ id: 'created-folder-id' });
    expect(createFolderMock).toHaveBeenCalledWith({
      accessToken: 'token',
      parentFolderId: 'parent-1',
      name: '#1 契約書',
    });
  });

  it('親フォルダIDにURLが入力されていてもIDを正規化して作成する', async () => {
    createFolderMock.mockResolvedValueOnce({ id: 'created-folder-id' });
    const condition = {
      ...baseCondition,
      parentFolderId: 'https://drive.google.com/drive/folders/parent-1?usp=sharing',
    };
    await createRecordFolder({ accessToken: 'token', condition, record: baseRecord });
    expect(createFolderMock).toHaveBeenCalledWith({
      accessToken: 'token',
      parentFolderId: 'parent-1',
      name: '#1 契約書',
    });
  });
});

describe('assignExistingFolder', () => {
  it('入力が空の場合はエラーを投げる', async () => {
    await expect(assignExistingFolder({ accessToken: 'token', input: '   ' })).rejects.toThrow(
      'フォルダIDまたはURL'
    );
  });

  it('有効な既存フォルダのID/URLを検証して割り当てる', async () => {
    getFolderMock.mockResolvedValueOnce({
      id: 'existing-folder-id',
      name: '既存フォルダ',
      mimeType: 'application/vnd.google-apps.folder',
      trashed: false,
    });
    const result = await assignExistingFolder({
      accessToken: 'token',
      input: 'https://drive.google.com/drive/folders/existing-folder-id?usp=sharing',
    });
    expect(result).toEqual({ id: 'existing-folder-id', name: '既存フォルダ' });
    expect(getFolderMock).toHaveBeenCalledWith({
      accessToken: 'token',
      folderId: 'existing-folder-id',
    });
  });

  it('フォルダ以外(mimeTypeが一致しない)を指定した場合はエラーを投げる', async () => {
    getFolderMock.mockResolvedValueOnce({
      id: 'file-id',
      name: '普通のファイル',
      mimeType: 'text/plain',
      trashed: false,
    });
    await expect(assignExistingFolder({ accessToken: 'token', input: 'file-id' })).rejects.toThrow(
      'フォルダではありません'
    );
  });

  it('ゴミ箱に入っているフォルダを指定した場合はエラーを投げる', async () => {
    getFolderMock.mockResolvedValueOnce({
      id: 'trashed-folder-id',
      name: '削除済みフォルダ',
      mimeType: 'application/vnd.google-apps.folder',
      trashed: true,
    });
    await expect(
      assignExistingFolder({ accessToken: 'token', input: 'trashed-folder-id' })
    ).rejects.toThrow('ゴミ箱');
  });
});

describe('readFolderId', () => {
  it('フィールドに値が設定されている場合はその値を返す', () => {
    const record = {
      driveFolderId: { type: 'SINGLE_LINE_TEXT', value: 'folder-123' },
    } as unknown as kintoneAPI.RecordData;
    expect(readFolderId(record, 'driveFolderId')).toBe('folder-123');
  });

  it('フィールドが空文字の場合はnullを返す', () => {
    const record = {
      driveFolderId: { type: 'SINGLE_LINE_TEXT', value: '' },
    } as unknown as kintoneAPI.RecordData;
    expect(readFolderId(record, 'driveFolderId')).toBeNull();
  });

  it('フィールドが存在しない場合はnullを返す', () => {
    const record = {} as unknown as kintoneAPI.RecordData;
    expect(readFolderId(record, 'driveFolderId')).toBeNull();
  });
});
