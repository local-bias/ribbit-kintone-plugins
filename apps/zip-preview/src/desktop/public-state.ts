import { downloadFile, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { atomFamily, atomWithReset } from 'jotai/utils';
import zip from 'jszip';
import { entries } from 'remeda';
import { type FileContent, getUncompressedSize, sortFileContents } from '@/lib/files';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';

export const pluginConfigAtom = atom(restorePluginConfig());
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);

export const currentAppFormFieldsAtom = atom((get) => {
  return get(appFormFieldsAtom({ app: get(currentAppIdAtom), guestSpaceId: GUEST_SPACE_ID }));
});

export const targetRecordAtom = atom<kintoneAPI.RecordData | null>(null);

export const fileFieldsAtom = atom<(kintoneAPI.field.File & { code: string })[]>((get) => {
  const record = get(targetRecordAtom);
  if (!record) {
    return [];
  }

  const fileFields = entries(record).filter(([, field]) => field.type === 'FILE') as [
    key: string,
    value: kintoneAPI.field.File,
  ][];

  return fileFields.map(([code, { type, value }]) => ({ code, type, value }));
});

export const fileFieldsWithZipAtom = atom((get) => {
  const fields = get(fileFieldsAtom);
  const filter = (file: kintoneAPI.field.File['value'][number]) =>
    file.contentType === 'application/zip' || file.contentType === 'application/x-zip-compressed';
  return fields
    .filter((field) => field.value.some(filter))
    .map((field) => ({ code: field.code, type: field.type, value: field.value.filter(filter) }));
});

export const previewZipFileKeyAtom = atomWithReset<string | null>(null);
export const previewZipFileNameAtom = atomWithReset<string | null>(null);

export const selectedFileContentKeyAtom = atomWithReset<string | null>(null);

export type DetailContent =
  | {
      type: 'text';
      value: string;
    }
  | {
      type: 'image';
      value: Blob;
    }
  | {
      type: 'blob';
      value: Blob;
    };

export type SelectedFileDetails = {
  name: string;
  size?: number;
  content: DetailContent;
};

export const detailFileAtom = atom(async (get) => {
  const fileKey = get(selectedFileContentKeyAtom);
  if (!fileKey) return null;
  const zipFileKey = get(previewZipFileKeyAtom);
  if (!zipFileKey) return null;
  const zipFile = await get(zipFileAtom(zipFileKey));
  if (!zipFile) return null;
  const file = zipFile.files[fileKey];
  isDev && console.log('📄 file', { fileKey, file });
  return file ?? null;
});

export const detailFileBlobAtom = atom(async (get) => {
  const file = await get(detailFileAtom);
  if (!file) return null;
  const blob = await file.async('blob');
  return blob;
});

export const selectedFileDetailsAtom = atom<Promise<SelectedFileDetails | null>>(async (get) => {
  const file = await get(detailFileAtom);
  if (!file) return null;

  if (/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i.test(file.name)) {
    // 画像ファイルの場合はBlob URLを生成
    const blob = await get(detailFileBlobAtom);
    if (!blob) return null;
    return {
      name: file.name,
      size: getUncompressedSize(file),
      content: {
        type: 'image',
        value: blob,
      },
    };
  }

  // ファイルサイズが30KB以上の場合はBlob URLを生成
  const size = getUncompressedSize(file);
  if (size && size > 1024 * 30) {
    const blob = await get(detailFileBlobAtom);
    if (!blob) return null;
    return {
      name: file.name,
      size,
      content: {
        type: 'blob',
        value: blob,
      },
    };
  }

  const fileContent = await file.async('text');
  return {
    name: file.name,
    size,
    content: {
      type: 'text',
      value: fileContent,
    },
  };
});

export const handleFileContentSelectAtom = atom(null, (_, set, key: string) => {
  set(selectedFileContentKeyAtom, key);
});

const fileAtom = atomFamily((fileKey: string) =>
  atom(async () => {
    const file = await downloadFile({ fileKey, guestSpaceId: GUEST_SPACE_ID, debug: isDev });
    isDev && console.log('📄 file', file);
    return file;
  })
);

const zipFileAtom = atomFamily((fileKey: string) =>
  atom(async (get) => {
    const file = get(fileAtom(fileKey));
    if (!file) {
      return null;
    }
    try {
      const zipFile = await zip.loadAsync(file);
      isDev && console.log('🤐 zipFile', zipFile);
      return zipFile;
    } catch (error) {
      isDev && console.error('Error loading zip file:', error);
      return null;
    }
  })
);

const unzipContentAtom = atomFamily((fileKey: string) =>
  atom(async (get) => {
    const zipFile = await get(zipFileAtom(fileKey));
    if (!zipFile) {
      return null;
    }

    // 階層構造を作成するためのマップ
    const pathMap = new Map<string, FileContent>();
    // ルートレベルのエントリを格納する配列
    const rootEntries: FileContent[] = [];

    // すべてのファイルとディレクトリを処理する
    for (const [path, file] of Object.entries(zipFile.files)) {
      if (!path || path === '') continue;

      const isDirectory = file.dir;
      const pathParts = path.split('/');

      // 末尾の空文字を削除（ディレクトリの末尾スラッシュで発生）
      if (pathParts[pathParts.length - 1] === '') {
        pathParts.pop();
      }

      // ファイル/ディレクトリ名
      const name = pathParts[pathParts.length - 1] || '';
      const updatedAt = file.date.toISOString();
      const size = getUncompressedSize(file);

      // このエントリのパス（ディレクトリの場合は末尾に/を付ける）
      const normalizedPath = isDirectory ? `${pathParts.join('/')}/` : path;

      // ファイルコンテンツオブジェクトの作成
      const fileContent: FileContent = {
        key: path,
        name,
        isDirectory,
        path: normalizedPath,
        updatedAt,
        size,
        children: isDirectory ? [] : undefined,
      };

      // マップに登録
      pathMap.set(normalizedPath, fileContent);
    }

    // すべてのパスを見て、親子関係を構築する
    for (const [path, content] of pathMap.entries()) {
      // パスコンポーネントを取得
      const pathParts = path.split('/').filter(Boolean);

      if (pathParts.length === 0) {
      } else if (pathParts.length === 1) {
        // ルートレベルのエントリ
        rootEntries.push(content);
      } else {
        // 親ディレクトリパスを構築
        const parentPathParts = pathParts.slice(0, -1);
        const parentPath = `${parentPathParts.join('/')}/`;

        // 親ディレクトリを取得
        const parentDir = pathMap.get(parentPath);
        if (parentDir && parentDir.children) {
          // 親の子コレクションに追加
          parentDir.children.push(content);
        } else {
          // 親が見つからない場合は、中間ディレクトリを作成する必要がある
          // まず、このパスに至るすべての中間ディレクトリを確保
          let currentPath = '';
          for (let i = 0; i < parentPathParts.length; i++) {
            const part = parentPathParts[i] ?? '';
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const dirPath = `${currentPath}/`;

            if (!pathMap.has(dirPath)) {
              // 中間ディレクトリを作成
              const dirContent: FileContent = {
                key: path,
                name: part,
                isDirectory: true,
                path: dirPath,
                children: [],
              };
              pathMap.set(dirPath, dirContent);

              // 親にこの中間ディレクトリを追加
              if (i === 0) {
                // ルートレベルの中間ディレクトリ
                rootEntries.push(dirContent);
              } else {
                // 親ディレクトリに追加
                const parentDirPath = `${parentPathParts.slice(0, i).join('/')}/`;
                const parentOfMiddleDir = pathMap.get(parentDirPath);
                if (parentOfMiddleDir && parentOfMiddleDir.children) {
                  parentOfMiddleDir.children.push(dirContent);
                }
              }
            }
          }

          // 親を再取得して子を追加
          const newParentDir = pathMap.get(parentPath);
          if (newParentDir && newParentDir.children) {
            newParentDir.children.push(content);
          } else {
            console.warn(`Still could not find parent dir: ${parentPath} for path: ${path}`);
          }
        }
      }
    }

    // 全てのディレクトリの children に対して再帰的にソートを適用する
    const sortAllDirectoryChildren = (entries: FileContent[]) => {
      for (const entry of entries) {
        if (entry.isDirectory && entry.children && entry.children.length > 0) {
          entry.children.sort(sortFileContents);
          sortAllDirectoryChildren(entry.children);
        }
      }
    };

    // すべての階層に対してソートを適用
    sortAllDirectoryChildren(rootEntries);

    isDev && console.log('Processed file structure:', rootEntries);
    return rootEntries.sort(sortFileContents);
  })
);

/**
 * ユーザーが選択したZipファイルの内容を取得するatom
 */
export const previewFileAtom = atom(async (get) => {
  const fileKey = get(previewZipFileKeyAtom);
  if (!fileKey) {
    return null;
  }
  return get(unzipContentAtom(fileKey));
});
