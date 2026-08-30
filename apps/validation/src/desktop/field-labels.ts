import { getAppId, getFormFields } from '@konomi-app/kintone-utilities';
import { PLUGIN_NAME } from '@/lib/constants';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';

/**
 * フィールドコードとフィールド名（ラベル）の対応。
 * 取得前・取得失敗時は空となり、その場合はフィールドコードで代替する。
 */
let fieldLabels: Record<string, string> = {};

/** 取得処理の重複実行を防ぐためのキャッシュ */
let loading: Promise<void> | null = null;

/**
 * フィールド名の一覧を取得し、以降`getFieldLabel`で参照できるようにします。
 *
 * エラー通知でフィールド名を表示するために使用します。
 * 取得に失敗してもレコードの操作は継続させたいため、この関数はrejectせず、
 * ログ出力のみ行います（フィールド名はフィールドコードで代替されます）。
 */
export function loadFieldLabels(): Promise<void> {
  if (loading) {
    return loading;
  }
  loading = (async () => {
    try {
      const appId = getAppId();
      if (!appId) {
        isDev && console.warn(`[${PLUGIN_NAME}] アプリIDの取得に失敗しました。`);
        return;
      }
      const { properties } = await getFormFields({ app: appId, guestSpaceId: GUEST_SPACE_ID });
      fieldLabels = Object.fromEntries(
        Object.entries(properties).map(([fieldCode, property]) => [fieldCode, property.label])
      );
    } catch (error) {
      console.error(`[${PLUGIN_NAME}] フィールド情報の取得に失敗しました。`, error);
    }
  })();
  return loading;
}

/**
 * フィールドコードに対応するフィールド名を返します。
 * フィールド名が取得できていない場合は、フィールドコードをそのまま返します。
 */
export function getFieldLabel(fieldCode: string): string {
  return fieldLabels[fieldCode] || fieldCode;
}
