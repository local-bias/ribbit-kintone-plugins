import zip from 'jszip';
import { z } from 'zod';

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const zipObjectSizeSchema = z.number().optional();

/**
 * Zipファイル内のオブジェクトのサイズを取得します。
 *
 * 💣 この関数は{@link zip.JSZipObject}の実装に依存しています。将来的に動作しなくなる可能性があります。
 *
 * @param file - Zipファイル内のオブジェクト
 */
export function getUncompressedSize(file: zip.JSZipObject) {
  // @ts-expect-error - `_data`はメタデータであるため、型定義に含まれていない。
  const size = file._data?.uncompressedSize;

  const parsed = zipObjectSizeSchema.safeParse(size);
  if (parsed.success) {
    return parsed.data;
  }
  return undefined;
}

export type FileContent = {
  key: string;
  name: string;
  isDirectory: boolean;
  path: string;
  updatedAt?: string; // Optional: Last update timestamp in ISO 8601 format
  size?: number; // Optional: File size in bytes (only applicable for files)
  children?: FileContent[]; // Optional: Array of child directories or files (only applicable for directories)
};

export function sortFileContents(a: FileContent, b: FileContent): number {
  if (a.isDirectory && !b.isDirectory) {
    return -1;
  }
  if (!a.isDirectory && b.isDirectory) {
    return 1;
  }
  return a.name.localeCompare(b.name);
}
