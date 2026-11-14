import type { PluginCommonConfig } from '@/schema/plugin-config';

/**
 * アセット管理アプリのレコードのアクセス権から、パネルで操作できることを判定します(純粋関数)
 *
 * `records/acl/evaluate.json`はレコード単位に加えてフィールド単位の`editable`も返す。
 * 推奨のアクセス権(docs/08-security.md 2-1)では「状態」などのフィールドだけを読み取り専用にするため、
 * レコード単位だけで判定すると「押せるのに必ず失敗するスイッチ」を出してしまう。
 *
 * UI要素ごとに「レコードを編集できる」かつ「その要素が書き込むフィールドを編集できる」で判定する。
 * フィールドを対応付けていなければ、その要素は操作できない。
 *
 * @see docs/06-ui.md 5章「有効スイッチの挙動」
 */

export type AclRight = {
  id: string;
  record: { viewable: boolean; editable: boolean; deletable: boolean };
  fields: Record<string, { viewable: boolean; editable: boolean }>;
};

export type AssetAccess = {
  /** 有効スイッチで、レコードの「状態」を変えられる */
  canToggleStatus: boolean;
  /** 影響範囲を変えられる(「全員」にするには、さらに公開権限が要る) */
  canChangeScope: boolean;
  /** ドラッグで実行順を変えられる */
  canReorder: boolean;
  /** 詳細でコードを保存できる */
  canEditCode: boolean;
  /** 権限スイッチを変えられる */
  canEditPermissions: boolean;
  /** 通信先を編集できる */
  canEditExternalUrls: boolean;
  canDelete: boolean;
  /**
   * メンテナンス中などで、いま操作できない
   *
   * 取得できたレコードが閲覧不可で返るのは、権限ではなくアプリの状態による。「権限がありません」と区別して表示する
   */
  unavailable: boolean;
};

/** アクセス権を取得できなかったときの扱い(操作させない) */
export const NO_ACCESS: AssetAccess = {
  canToggleStatus: false,
  canChangeScope: false,
  canReorder: false,
  canEditCode: false,
  canEditPermissions: false,
  canEditExternalUrls: false,
  canDelete: false,
  unavailable: false,
};

export type AccessFieldCodes = Pick<
  PluginCommonConfig,
  | 'statusFieldCode'
  | 'scopeFieldCode'
  | 'orderFieldCode'
  | 'codeFieldCode'
  | 'permissionsFieldCode'
  | 'externalUrlsFieldCode'
>;

/**
 * `fields`はアクセス権を設定していないフィールドも含めて返るため、無いのは設定のフィールドコードが
 * 管理アプリに存在しないとき。そのときは操作させない
 */
const canEditField = (right: AclRight, fieldCode: string): boolean =>
  fieldCode !== '' && right.record.editable && (right.fields[fieldCode]?.editable ?? false);

/** レコードIDごとに、パネルで操作できることを返します */
export const evaluateAssetAccess = (
  rights: readonly AclRight[],
  codes: AccessFieldCodes
): Map<string, AssetAccess> =>
  new Map(
    rights.map((right) => [
      String(right.id),
      {
        canToggleStatus: canEditField(right, codes.statusFieldCode),
        canChangeScope: canEditField(right, codes.scopeFieldCode),
        canReorder: canEditField(right, codes.orderFieldCode),
        canEditCode: canEditField(right, codes.codeFieldCode),
        canEditPermissions: canEditField(right, codes.permissionsFieldCode),
        // 通信先は外部通信の許可範囲そのものなので、権限スイッチと同じ規則も満たすこと(docs/06 5章)
        canEditExternalUrls:
          canEditField(right, codes.permissionsFieldCode) &&
          canEditField(right, codes.externalUrlsFieldCode),
        canDelete: right.record.deletable,
        unavailable: !right.record.viewable,
      },
    ])
  );
