import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/global', () => ({
  isDev: false,
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
  GUEST_SPACE_ID: undefined,
  LANGUAGE: 'ja',
}));

import {
  buildCreateFileResourceBody,
  buildCreateFolderBody,
  buildListQuery,
  buildMultipartUploadBody,
  buildPreviewUrl,
  extractErrorDetail,
  extractFolderIdFromInput,
  parseDriveFilesResponse,
} from './drive';

describe('buildListQuery', () => {
  it('指定フォルダ直下・ゴミ箱を除外するクエリを生成する', () => {
    expect(buildListQuery('folder-123')).toBe("'folder-123' in parents and trashed = false");
  });

  it('フォルダIDに含まれるシングルクォートをエスケープする', () => {
    expect(buildListQuery("fol'der")).toBe("'fol\\'der' in parents and trashed = false");
  });
});

describe('parseDriveFilesResponse', () => {
  it('files配列から必要なフィールドを持つファイルのみを抽出する', () => {
    const result = parseDriveFilesResponse({
      files: [
        { id: '1', name: 'a.txt', mimeType: 'text/plain' },
        { id: '2', name: 'b.pdf', mimeType: 'application/pdf', size: '1024' },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: '1', name: 'a.txt', mimeType: 'text/plain' });
  });

  it('不正な形式のファイル項目を除外する', () => {
    const result = parseDriveFilesResponse({
      files: [{ id: '1', name: 'a.txt', mimeType: 'text/plain' }, { id: '2' }, null, 'invalid'],
    });
    expect(result).toHaveLength(1);
  });

  it('filesプロパティが存在しない場合は空配列を返す', () => {
    expect(parseDriveFilesResponse({})).toEqual([]);
  });

  it('nullや文字列などオブジェクトでない入力に対して空配列を返す', () => {
    expect(parseDriveFilesResponse(null)).toEqual([]);
    expect(parseDriveFilesResponse('invalid')).toEqual([]);
  });
});

describe('buildCreateFolderBody', () => {
  it('GoogleドライブのフォルダmimeTypeと親フォルダIDを含むリクエストボディを生成する', () => {
    expect(buildCreateFolderBody({ name: 'record-1', parentFolderId: 'parent-1' })).toEqual({
      name: 'record-1',
      mimeType: 'application/vnd.google-apps.folder',
      parents: ['parent-1'],
    });
  });
});

describe('buildCreateFileResourceBody', () => {
  it('ファイル名と親フォルダIDを含むリクエストボディを生成する', () => {
    expect(buildCreateFileResourceBody({ name: 'file.txt', folderId: 'folder-1' })).toEqual({
      name: 'file.txt',
      parents: ['folder-1'],
    });
  });
});

describe('extractFolderIdFromInput', () => {
  it('フォルダIDそのものを入力した場合はそのまま返す', () => {
    expect(extractFolderIdFromInput('1AbCdEfGhIjKlMnOpQrStUvWxYz')).toBe(
      '1AbCdEfGhIjKlMnOpQrStUvWxYz'
    );
  });

  it('前後の空白を除去する', () => {
    expect(extractFolderIdFromInput('  folder-id-123  ')).toBe('folder-id-123');
  });

  it('drive.google.com/drive/folders/<id> 形式のURLからIDを取り出す', () => {
    expect(
      extractFolderIdFromInput('https://drive.google.com/drive/folders/1AbCdEfGhIj?usp=sharing')
    ).toBe('1AbCdEfGhIj');
  });

  it('drive.google.com/open?id=<id> 形式のURLからIDを取り出す', () => {
    expect(extractFolderIdFromInput('https://drive.google.com/open?id=1AbCdEfGhIj')).toBe(
      '1AbCdEfGhIj'
    );
  });

  it('フォルダIDを含まないURLの場合は空文字を返す', () => {
    expect(extractFolderIdFromInput('https://drive.google.com/drive/my-drive')).toBe('');
  });

  it('空文字・空白のみの入力に対して空文字を返す', () => {
    expect(extractFolderIdFromInput('')).toBe('');
    expect(extractFolderIdFromInput('   ')).toBe('');
  });
});

describe('extractErrorDetail', () => {
  it('error.messageを含むJSONレスポンスから詳細メッセージを取り出す', async () => {
    const response = new Response(JSON.stringify({ error: { message: 'File not found: abc' } }), {
      status: 404,
    });
    expect(await extractErrorDetail(response)).toBe('File not found: abc (status: 404)');
  });

  it('OAuthエラー形式(error_description)からも詳細メッセージを取り出す', async () => {
    const response = new Response(
      JSON.stringify({ error: 'invalid_grant', error_description: 'Bad Request' }),
      { status: 400 }
    );
    expect(await extractErrorDetail(response)).toBe('Bad Request (status: 400)');
  });

  it('JSONとして解析できないレスポンスの場合はステータスコードのみを返す', async () => {
    const response = new Response('<html>Not Found</html>', { status: 404 });
    expect(await extractErrorDetail(response)).toBe('status: 404');
  });

  it('メッセージを含まないJSONレスポンスの場合はステータスコードのみを返す', async () => {
    const response = new Response(JSON.stringify({}), { status: 500 });
    expect(await extractErrorDetail(response)).toBe('status: 500');
  });
});

describe('buildMultipartUploadBody', () => {
  it('メタデータ部とファイル内容部の両方を含むmultipart/relatedボディを生成する', async () => {
    const file = new File(['hello world'], 'greeting.txt', { type: 'text/plain' });
    const boundary = 'test-boundary';
    const body = buildMultipartUploadBody({
      file,
      metadata: { name: 'greeting.txt', parents: ['folder-1'] },
      boundary,
    });
    const text = await body.text();

    expect(text).toContain(`--${boundary}`);
    expect(text).toContain('Content-Type: application/json; charset=UTF-8');
    expect(text).toContain(JSON.stringify({ name: 'greeting.txt', parents: ['folder-1'] }));
    expect(text).toContain('Content-Type: text/plain');
    expect(text).toContain('hello world');
    expect(text.trim().endsWith(`--${boundary}--`)).toBe(true);
  });

  it('生成したボディのサイズが、メタデータとファイル内容の合計を反映している(0バイトにならない)', async () => {
    const fileContent = 'x'.repeat(1000);
    const file = new File([fileContent], 'data.bin', { type: 'application/octet-stream' });
    const body = buildMultipartUploadBody({
      file,
      metadata: { name: 'data.bin', parents: ['folder-1'] },
      boundary: 'test-boundary',
    });
    expect(body.size).toBeGreaterThanOrEqual(fileContent.length);
  });

  it('ファイルのMIMEタイプが空の場合はoctet-streamとして扱う', async () => {
    const file = new File(['content'], 'unknown', { type: '' });
    const body = buildMultipartUploadBody({
      file,
      metadata: { name: 'unknown', parents: ['folder-1'] },
      boundary: 'test-boundary',
    });
    const text = await body.text();
    expect(text).toContain('Content-Type: application/octet-stream');
  });
});

describe('buildPreviewUrl', () => {
  it('PDF等の通常ファイルはdrive.google.comのfile previewエンドポイントを返す', () => {
    expect(buildPreviewUrl({ id: 'file-1', mimeType: 'application/pdf' })).toBe(
      'https://drive.google.com/file/d/file-1/preview'
    );
  });

  it('Googleドキュメントはdocs.google.com/documentのpreviewエンドポイントを返す', () => {
    expect(buildPreviewUrl({ id: 'doc-1', mimeType: 'application/vnd.google-apps.document' })).toBe(
      'https://docs.google.com/document/d/doc-1/preview'
    );
  });

  it('Googleスプレッドシートはdocs.google.com/spreadsheetsのpreviewエンドポイントを返す', () => {
    expect(
      buildPreviewUrl({ id: 'sheet-1', mimeType: 'application/vnd.google-apps.spreadsheet' })
    ).toBe('https://docs.google.com/spreadsheets/d/sheet-1/preview');
  });

  it('Googleスライドはdocs.google.com/presentationのpreviewエンドポイントを返す', () => {
    expect(
      buildPreviewUrl({ id: 'slide-1', mimeType: 'application/vnd.google-apps.presentation' })
    ).toBe('https://docs.google.com/presentation/d/slide-1/preview');
  });

  it('画像・動画・Office文書など、その他のMIMEタイプもfile previewエンドポイントを返す', () => {
    expect(buildPreviewUrl({ id: 'img-1', mimeType: 'image/png' })).toBe(
      'https://drive.google.com/file/d/img-1/preview'
    );
  });
});
