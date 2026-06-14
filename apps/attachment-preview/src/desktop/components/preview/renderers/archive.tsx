import JSZip from 'jszip';
import { File as FileIcon, Folder } from 'lucide-react';
import { formatFileSize } from '@/lib/preview';
import { useAsync } from '../use-async';
import { ErrorPlaceholder, LoadingPlaceholder, MessagePlaceholder } from '../placeholder';

type ArchiveEntry = {
  path: string;
  name: string;
  depth: number;
  isDirectory: boolean;
  size?: number;
};

/**
 * JSZipのオブジェクトから展開後サイズを取得します。
 * 💣 `_data`は内部実装に依存しているため、将来動作しなくなる可能性があります。
 */
function getUncompressedSize(file: JSZip.JSZipObject): number | undefined {
  // @ts-expect-error - `_data`はメタデータであり型定義に含まれていません
  const size = file._data?.uncompressedSize;
  return typeof size === 'number' ? size : undefined;
}

async function parseArchive(blob: Blob): Promise<ArchiveEntry[]> {
  const zip = await JSZip.loadAsync(blob);
  const entries: ArchiveEntry[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (!path) continue;
    const parts = path.split('/').filter(Boolean);
    const name = parts[parts.length - 1] ?? path;
    entries.push({
      path,
      name,
      depth: Math.max(parts.length - 1, 0),
      isDirectory: file.dir,
      size: file.dir ? undefined : getUncompressedSize(file),
    });
  }

  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

export default function ArchivePreview({ blob }: { blob: Blob }) {
  const state = useAsync(() => parseArchive(blob), [blob]);

  if (state.status === 'loading') {
    return <LoadingPlaceholder label='アーカイブを解析しています' />;
  }
  if (state.status === 'error') {
    return <ErrorPlaceholder message='アーカイブの解析に失敗しました。' />;
  }
  if (state.data.length === 0) {
    return <MessagePlaceholder>アーカイブが空でした。</MessagePlaceholder>;
  }

  return (
    <div className='rad:p-4'>
      <div className='rad:text-xs rad:text-foreground/50 rad:mb-2'>
        {state.data.length} 件のエントリ
      </div>
      <ul className='rad:divide-y rad:divide-border rad:rounded rad:border rad:border-border'>
        {state.data.map((entry) => (
          <li
            key={entry.path}
            className='rad:flex rad:items-center rad:gap-2 rad:px-3 rad:py-1.5 rad:text-sm'
            style={{ paddingLeft: `${entry.depth * 16 + 12}px` }}
          >
            {entry.isDirectory ? (
              <Folder className='rad:w-4 rad:h-4 rad:text-blue-500 rad:shrink-0' />
            ) : (
              <FileIcon className='rad:w-4 rad:h-4 rad:text-foreground/40 rad:shrink-0' />
            )}
            <span className='rad:flex-1 rad:truncate'>{entry.name}</span>
            {!entry.isDirectory && (
              <span className='rad:text-xs rad:text-foreground/50'>
                {formatFileSize(entry.size)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
