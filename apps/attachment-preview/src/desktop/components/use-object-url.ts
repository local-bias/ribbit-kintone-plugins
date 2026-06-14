import { useEffect, useState } from 'react';

/**
 * Blobから`URL.createObjectURL`でオブジェクトURLを生成し、
 * アンマウント時やBlob変更時に確実に解放するフック。
 */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
}
