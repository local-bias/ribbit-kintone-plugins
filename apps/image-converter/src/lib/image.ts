import { ImageFormat } from '@/schema/image';

/**
 * 画像ファイルを指定したフォーマットに変換する
 * @param imageFile - 変換する画像ファイル
 * @param outputFormat - 出力フォーマット {@link ImageFormat}
 * @param quality - 出力品質（0.0〜1.0）
 * @returns 変換されたBlobオブジェクト
 */
export async function convertImageFormat(
  imageFile: File,
  outputFormat: ImageFormat,
  quality: number = 0.8
): Promise<Blob> {
  try {
    // 画像の読み込み
    const img: HTMLImageElement = await loadImage(imageFile);

    // Canvas要素の作成と画像の描画
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D コンテキストの取得に失敗しました');
    }

    // 透明度の処理（JPEGの場合、背景色を設定）
    if (outputFormat === 'jpeg') {
      ctx.fillStyle = '#FFFFFF'; // 白背景
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    // 指定されたフォーマットに変換
    const mimeType = `image/${outputFormat}`;
    const convertedBlob: Blob = await canvasToBlob(canvas, mimeType, quality);
    return convertedBlob;
  } catch (error) {
    console.error('画像変換エラー:', error);
    throw error;
  }
}

/**
 * 画像ファイルをロードしてImageオブジェクトを返す
 * @param file - 画像ファイル
 * @returns 読み込まれた画像要素
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Canvas要素から指定フォーマットのBlobを生成する
 * @param canvas - Canvas要素
 * @param mimeType - 出力するMIMEタイプ
 * @param quality - 出力品質（0.0〜1.0）
 * @returns 指定フォーマットのBlobオブジェクト
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob: Blob | null) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error(`${mimeType}形式への変換に失敗しました`));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * 特定の画像フォーマットがブラウザでサポートされているか確認する
 * @param format - 確認するフォーマット {@link ImageFormat}
 * @returns サポート状況
 */
export function isFormatSupported(format: ImageFormat): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const mimeType = `image/${format}`;
  const dataUrl = canvas.toDataURL(mimeType);
  return dataUrl.indexOf(mimeType) === 5; // "data:image/xxx"の形式で返される
}
