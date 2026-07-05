import { GOOGLE_DRIVE_API_BASE_URL, GOOGLE_DRIVE_UPLOAD_API_BASE_URL } from '@/lib/constants';
import { PLUGIN_ID } from '@/lib/global';
import { GOOGLE_NATIVE_MIME_TYPES } from '@/lib/mime-icon';
import { ketch } from './browser';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

const DRIVE_FILE_LIST_FIELDS = 'files(id,name,mimeType,webViewLink,modifiedTime,size)';

const GOOGLE_NATIVE_PREVIEW_PATH_BY_MIME_TYPE: Record<string, string> = {
  [GOOGLE_NATIVE_MIME_TYPES.document]: 'document',
  [GOOGLE_NATIVE_MIME_TYPES.spreadsheet]: 'spreadsheets',
  [GOOGLE_NATIVE_MIME_TYPES.presentation]: 'presentation',
};

/**
 * kintoneから離れずにファイルをプレビューするための、Google製の埋め込み用iframe URLを構築します
 *
 * Googleドキュメント/スプレッドシート/スライドは`docs.google.com`側の専用プレビューURLを、
 * それ以外(PDF・画像・動画・Office文書など)は`drive.google.com/file/d/.../preview`を使用する。
 * どちらもGoogle公式の埋め込み用エンドポイントで、ファイルのバイナリをこちら側で取得する必要がない。
 *
 * `getIconCategory`(アイコン表示用)とは判定基準をあえて共有しない。アイコン分類はWord文書等も
 * "document"カテゴリにまとめるが、こちらはGoogleドキュメント以外を誤ってdocs.google.com側の
 * URLへ振り分けないよう、MIMEタイプの完全一致のみで判定する必要があるため。
 */
export const buildPreviewUrl = (file: { id: string; mimeType: string }): string => {
  const nativePath = GOOGLE_NATIVE_PREVIEW_PATH_BY_MIME_TYPE[file.mimeType];
  if (nativePath) {
    return `https://docs.google.com/${nativePath}/d/${file.id}/preview`;
  }
  return `https://drive.google.com/file/d/${file.id}/preview`;
};

const authHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
});

/** Google APIのエラーレスポンス本文から、可能な限り詳細なメッセージを取り出します */
export const extractErrorDetail = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    const message = body?.error?.message ?? body?.error_description ?? body?.error;
    if (typeof message === 'string' && message) {
      return `${message} (status: ${response.status})`;
    }
  } catch {
    // レスポンスがJSONでない場合は、ステータスコードのみで表示する
  }
  return `status: ${response.status}`;
};

/** フォルダ直下のファイル一覧を取得するためのDriveクエリを構築します(ゴミ箱に入ったファイルは除外) */
export const buildListQuery = (folderId: string): string => {
  const escapedFolderId = folderId.replace(/'/g, "\\'");
  return `'${escapedFolderId}' in parents and trashed = false`;
};

const DRIVE_FOLDER_URL_ID_PATTERN = /\/folders\/([^/?#]+)/;

/**
 * ユーザーが入力したGoogleドライブのフォルダID、またはURLからフォルダIDを取り出します
 *
 * 対応形式:
 * - フォルダIDそのもの
 * - `https://drive.google.com/drive/folders/<id>` 形式のURL
 * - `https://drive.google.com/open?id=<id>` 形式のURL
 */
export const extractFolderIdFromInput = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const url = new URL(trimmed);
    const folderMatch = url.pathname.match(DRIVE_FOLDER_URL_ID_PATTERN);
    if (folderMatch?.[1]) {
      return folderMatch[1];
    }
    const idParam = url.searchParams.get('id');
    if (idParam) {
      return idParam;
    }
    return '';
  } catch {
    // URLとして解析できない場合は、入力値をフォルダIDそのものとして扱う
    return trimmed;
  }
};

/** Drive files.list APIのレスポンスから、必要なファイル情報のみを取り出します */
export const parseDriveFilesResponse = (json: unknown): DriveFile[] => {
  if (typeof json !== 'object' || json === null || !('files' in json)) {
    return [];
  }
  const { files } = json as { files: unknown };
  if (!Array.isArray(files)) {
    return [];
  }
  return files.filter(
    (file): file is DriveFile =>
      typeof file === 'object' &&
      file !== null &&
      typeof (file as DriveFile).id === 'string' &&
      typeof (file as DriveFile).name === 'string' &&
      typeof (file as DriveFile).mimeType === 'string'
  );
};

export const buildCreateFolderBody = (params: { name: string; parentFolderId: string }) => ({
  name: params.name,
  mimeType: 'application/vnd.google-apps.folder',
  parents: [params.parentFolderId],
});

export const buildCreateFileResourceBody = (params: { name: string; folderId: string }) => ({
  name: params.name,
  parents: [params.folderId],
});

/**
 * 指定フォルダ直下のファイル・フォルダ一覧を取得します
 */
export const listFolderContents = async (params: {
  accessToken: string;
  folderId: string;
}): Promise<DriveFile[]> => {
  const { accessToken, folderId } = params;
  const query = new URLSearchParams({
    q: buildListQuery(folderId),
    fields: DRIVE_FILE_LIST_FIELDS,
    pageSize: '1000',
    // 共有ドライブ(Shared Drive)内のフォルダにも対応する
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const response = await ketch(`${GOOGLE_DRIVE_API_BASE_URL}/files?${query.toString()}`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(
      `Googleドライブのファイル一覧取得に失敗しました: ${await extractErrorDetail(response)}`
    );
  }
  return parseDriveFilesResponse(await response.json());
};

/**
 * レコード用のフォルダを、指定した親フォルダの直下に作成します
 */
export const createFolder = async (params: {
  accessToken: string;
  parentFolderId: string;
  name: string;
}): Promise<{ id: string }> => {
  const { accessToken, parentFolderId, name } = params;
  // 共有ドライブ(Shared Drive)配下への作成にも対応する
  const response = await ketch(`${GOOGLE_DRIVE_API_BASE_URL}/files?supportsAllDrives=true`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify(buildCreateFolderBody({ name, parentFolderId })),
  });
  if (!response.ok) {
    throw new Error(
      `Googleドライブのフォルダ作成に失敗しました: ${await extractErrorDetail(response)}`
    );
  }
  return response.json();
};

export interface DriveFolderInfo {
  id: string;
  name: string;
  mimeType: string;
  trashed: boolean;
}

/**
 * 指定IDのファイル(フォルダ)情報を取得します
 *
 * 既存フォルダを割り当てる際、対象が実在しフォルダであることを検証するために使用します
 */
export const getFolder = async (params: {
  accessToken: string;
  folderId: string;
}): Promise<DriveFolderInfo> => {
  const { accessToken, folderId } = params;
  const query = new URLSearchParams({
    fields: 'id,name,mimeType,trashed',
    // 共有ドライブ(Shared Drive)内のフォルダにも対応する
    supportsAllDrives: 'true',
  });
  const response = await ketch(
    `${GOOGLE_DRIVE_API_BASE_URL}/files/${folderId}?${query.toString()}`,
    {
      method: 'GET',
      headers: authHeaders(accessToken),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Googleドライブのフォルダ情報取得に失敗しました: ${await extractErrorDetail(response)}`
    );
  }
  return response.json();
};

/**
 * フォルダ(ファイル)を削除します
 *
 * レコードへのフォルダID書き込みに失敗した際、孤立したフォルダを残さないためのロールバックに使用します
 */
export const deleteFolder = async (params: {
  accessToken: string;
  folderId: string;
}): Promise<void> => {
  const { accessToken, folderId } = params;
  // 共有ドライブ(Shared Drive)内のフォルダにも対応する
  const response = await ketch(
    `${GOOGLE_DRIVE_API_BASE_URL}/files/${folderId}?supportsAllDrives=true`,
    {
      method: 'DELETE',
      headers: authHeaders(accessToken),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Googleドライブのフォルダ削除に失敗しました: ${await extractErrorDetail(response)}`
    );
  }
};

/** multipart/relatedアップロードのboundary文字列を生成します */
const generateMultipartBoundary = (): string =>
  `gdrive-connect-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * multipart/related形式のアップロード用リクエストボディ(メタデータ部+バイナリ部)を構築します
 *
 * Google Drive APIのfiles.update(内容更新)は`PATCH`メソッドを要求するが、`kintone.proxy.upload`は
 * `POST`/`PUT`のみ対応のため、「空のファイル作成→内容更新」という2段階の方式は使えない。
 * そのため、files.create(`POST`)にメタデータとバイナリを1回でまとめて送るmultipartアップロードを使う。
 */
export const buildMultipartUploadBody = (params: {
  file: File;
  metadata: Record<string, unknown>;
  boundary: string;
}): Blob => {
  const { file, metadata, boundary } = params;
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const filePartHeader = `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;
  const closingPart = `\r\n--${boundary}--`;
  return new Blob([metadataPart, filePartHeader, file, closingPart]);
};

/**
 * ファイルをフォルダ直下へアップロードします(メタデータとバイナリを1回のリクエストにまとめて送信)
 *
 * `kintone.proxy`(テキスト専用・レスポンス10MB上限)では扱えないため、
 * バイナリを直接送信できる`kintone.plugin.app.proxy.upload`(最大200MB、POST/PUTのみ対応)を使用します
 */
export const uploadFile = async (params: {
  accessToken: string;
  folderId: string;
  file: File;
}): Promise<void> => {
  const { accessToken, folderId, file } = params;
  const boundary = generateMultipartBoundary();
  const body = buildMultipartUploadBody({
    file,
    metadata: buildCreateFileResourceBody({ name: file.name, folderId }),
    boundary,
  });
  // 共有ドライブ(Shared Drive)配下への作成にも対応する
  const url = `${GOOGLE_DRIVE_UPLOAD_API_BASE_URL}/files?uploadType=multipart&supportsAllDrives=true`;
  const headers = {
    ...authHeaders(accessToken),
    'Content-Type': `multipart/related; boundary=${boundary}`,
  };
  // kintone.proxy.uploadは失敗時(4xx/5xx含む)にPromiseがrejectされる仕様のため、
  // 呼び出し元のtry/catchでエラーとして扱われる
  await kintone.plugin.app.proxy.upload(PLUGIN_ID, url, 'POST', headers, {
    format: 'RAW',
    value: body,
  });
};
