import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { isUsagePluginConditionMet, restorePluginConfig } from '@/lib/plugin';
import { downloadFile, kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { entries } from 'remeda';
import zip from 'jszip';

export type FileContent = {
  name: string;
  isDirectory: boolean;
  path: string;
  updatedAt?: string; // Optional: Last update timestamp in ISO 8601 format
  size?: number; // Optional: File size in bytes (only applicable for files)
  children?: FileContent[]; // Optional: Array of child directories or files (only applicable for directories)
};

export const pluginConfigAtom = atom(restorePluginConfig());
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);
export const validPluginConditionsAtom = atom((get) =>
  get(pluginConditionsAtom).filter(isUsagePluginConditionMet)
);

export const currentAppFormFieldsAtom = atom((get) => {
  return get(appFormFieldsAtom({ appId: get(currentAppIdAtom), spaceId: GUEST_SPACE_ID }));
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

export const previewFileKeyAtom = atom<string | null>(null);

const fileAtom = atomFamily((fileKey: string) =>
  atom(async () => {
    return downloadFile({ fileKey, guestSpaceId: GUEST_SPACE_ID, debug: isDev });
  })
);

export const unzipContentAtom = atomFamily((fileKey: string) =>
  atom(async (get) => {
    const file = get(fileAtom(fileKey));
    if (!file) {
      return null;
    }

    const zipFile = await zip.loadAsync(file);
    console.log({ files: zipFile.files });

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
      // @ts-ignore
      const size = isDirectory ? undefined : file._data?.uncompressedSize;

      // このエントリのパス（ディレクトリの場合は末尾に/を付ける）
      const normalizedPath = isDirectory ? `${pathParts.join('/')}/` : path;

      // ファイルコンテンツオブジェクトの作成
      const fileContent: FileContent = {
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
        // 何もしない（空パスはスキップ）
        continue;
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

    console.log('Processed file structure:', rootEntries);
    return rootEntries;
  })
);

export const previewFileAtom = atom(async (get) => {
  const fileKey = get(previewFileKeyAtom);
  if (!fileKey) {
    return null;
  }
  return get(unzipContentAtom(fileKey));
});

export const showDrawerAtom = atom(false);
export const handleDrawerOpenAtom = atom(null, (_, set) => {
  set(showDrawerAtom, true);
});
export const handleDrawerCloseAtom = atom(null, (_, set) => {
  set(showDrawerAtom, false);
});
