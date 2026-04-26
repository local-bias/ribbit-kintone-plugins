import { isDev } from './global';

/**
 * ファイルをBase64エンコードされたData URLに変換する
 * 画像、PDFなど任意のファイル形式に対応
 */
export const getBase64EncodedFile = async (file: File): Promise<string> => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  return new Promise((resolve) => {
    reader.onload = () => {
      const base64Encoded = reader.result as string;
      isDev && console.log('base64Encoded', base64Encoded);
      resolve(base64Encoded);
    };
  });
};
