/**
 * `kintone.buildPageUrl`(比較的新しく追加されたAPI)の型定義。
 * `@kintone/dts-gen`の型定義には未収録のため、ここで補う。
 *
 * 提供前のkintone環境では未定義のため、`undefined`になり得る型として宣言し、
 * 呼び出し側で存在確認を強制する。
 *
 * @see https://cybozu.dev/ja/kintone/docs/js-api/kintone/build-page-url/
 */
declare namespace kintone {
  type BuildPageUrlAppPage =
    | 'APP_INDEX'
    | 'APP_CREATE'
    | 'APP_DETAIL'
    | 'APP_EDIT'
    | 'APP_PRINT'
    | 'APP_REPORT'
    | 'APP_INDEX_MOBILE'
    | 'APP_CREATE_MOBILE'
    | 'APP_DETAIL_MOBILE'
    | 'APP_EDIT_MOBILE'
    | 'APP_REPORT_MOBILE';

  interface BuildPageUrlAppParams {
    appId: string;
    recordId?: string;
    viewId?: string;
    reportId?: string;
  }

  const buildPageUrl:
    | ((page: BuildPageUrlAppPage, params: BuildPageUrlAppParams) => Promise<string>)
    | undefined;
}
