import { downloadFile } from '@konomi-app/kintone-utilities';
import { isDev } from '@/lib/global';

export type FileLoadRequest = {
  fileKey: string;
  onLoad: (blobUrl: string) => void;
};

const blobUrlCache = new Map<string, string>();

export const loadFilesBatch = async (
  requests: FileLoadRequest[],
  guestSpaceId: string | undefined,
  isCancelled: () => boolean
): Promise<void> => {
  for (const request of requests) {
    if (isCancelled()) return;

    const cached = blobUrlCache.get(request.fileKey);
    if (cached) {
      if (!isCancelled()) request.onLoad(cached);
      continue;
    }

    try {
      const blob = await downloadFile({
        fileKey: request.fileKey,
        guestSpaceId,
        debug: isDev,
      });
      if (isCancelled()) return;
      const blobUrl = URL.createObjectURL(blob);
      blobUrlCache.set(request.fileKey, blobUrl);
      request.onLoad(blobUrl);
    } catch {
      // ファイル取得失敗時は無視して次のファイルへ
    }
  }
};
