import { appFormFieldsAtom, atom, currentAppIdAtom } from '@repo/jotai';

/**
 * 現在のアプリのフォームフィールド一覧(プレビュー環境)を取得するatomを生成します。
 *
 * 各プラグインの`config/states/kintone.ts`に存在していた共通のatom定義を集約したものです。
 *
 * @example
 * ```ts
 * import { createCurrentAppFieldsAtom } from '@repo/plugin/react';
 * import { GUEST_SPACE_ID } from '@/lib/global';
 *
 * export const currentAppFieldsAtom = createCurrentAppFieldsAtom({ guestSpaceId: GUEST_SPACE_ID });
 * ```
 */
export const createCurrentAppFieldsAtom = (params?: { guestSpaceId?: string }) => {
  const { guestSpaceId } = params ?? {};
  return atom((get) => {
    const app = get(currentAppIdAtom);
    return get(
      appFormFieldsAtom({
        app,
        guestSpaceId,
        preview: true,
      })
    );
  });
};
