import { z } from 'zod';

/**
 * 画像フォーマットのリストを定義します。
 * - 'jpeg': JPEG形式
 * - 'png': PNG形式
 * - 'webp': WebP形式
 * - 'avif': AVIF形式
 */
export const IMAGE_FORMAT_LIST = ['jpeg', 'png', 'webp', 'avif'] as const;

/**
 * 画像フォーマットの列挙型スキーマを定義します。
 * `IMAGE_FORMAT_LIST` に含まれる値のみを許可します。
 * このスキーマは、画像フォーマットのバリデーションに使用されます。
 * @see {@link IMAGE_FORMAT_LIST}
 */
export const ImageFormatSchema = z.enum(IMAGE_FORMAT_LIST);

/**
 * 画像フォーマットの型を定義します。
 * `ImageFormatSchema` を使用して、画像フォーマットの値を型として定義します。
 * @see {@link ImageFormatSchema}
 * @see {@link IMAGE_FORMAT_LIST}
 */
export type ImageFormat = z.infer<typeof ImageFormatSchema>;
