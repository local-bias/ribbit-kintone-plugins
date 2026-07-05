import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { createFolder, extractFolderIdFromInput, getFolder } from '@/lib/drive';
import { buildFolderName } from '@/lib/folder-name';
import type { PluginCondition } from '@/schema/plugin-config';

/** レコードの値からフォルダ名を組み立て、設定された親フォルダの直下にGoogleドライブフォルダを作成します */
export const createRecordFolder = async (params: {
  accessToken: string;
  condition: PluginCondition;
  record: kintoneAPI.RecordData;
}): Promise<{ id: string }> => {
  const { accessToken, condition, record } = params;
  if (!condition.parentFolderId) {
    throw new Error('親フォルダIDが設定されていません。プラグイン設定を確認してください。');
  }
  // プラグイン設定にフォルダのURLがそのまま入力されていても動作するよう、IDを正規化する
  const parentFolderId = extractFolderIdFromInput(condition.parentFolderId);
  if (!parentFolderId) {
    throw new Error('親フォルダIDの形式が正しくありません。プラグイン設定を確認してください。');
  }
  const name = buildFolderName({ fieldCodes: condition.folderNameFieldCodes, record });
  return createFolder({ accessToken, parentFolderId, name });
};

/**
 * ユーザーが入力したID/URLから、既存のGoogleドライブフォルダをレコードへ割り当てます
 *
 * 割り当て先は{@link PluginCondition.parentFolderId}配下である必要はなく、
 * 認証したGoogleアカウントがアクセスできる任意のフォルダを指定できます。
 */
export const assignExistingFolder = async (params: {
  accessToken: string;
  input: string;
}): Promise<{ id: string; name: string }> => {
  const { accessToken, input } = params;
  const folderId = extractFolderIdFromInput(input);
  if (!folderId) {
    throw new Error('GoogleドライブのフォルダIDまたはURLを入力してください。');
  }
  const folder = await getFolder({ accessToken, folderId });
  if (folder.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error('指定されたIDはGoogleドライブのフォルダではありません。');
  }
  if (folder.trashed) {
    throw new Error('指定されたフォルダはゴミ箱に入っています。');
  }
  return { id: folder.id, name: folder.name };
};

/** レコードに保存されているGoogleドライブフォルダIDを取得します(未設定の場合はnull) */
export const readFolderId = (record: kintoneAPI.RecordData, fieldCode: string): string | null => {
  const value = record[fieldCode]?.value;
  return typeof value === 'string' && value ? value : null;
};
