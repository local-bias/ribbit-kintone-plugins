import type { Requirement } from './kintone-request-classifier';

/** ファサードが止めた操作の種類 */
export type DeniedOperation =
  | 'kintone.api'
  | 'kintone.proxy'
  | 'kintone.plugin.app.proxy'
  | 'kintone.getRequestToken';

export type PermissionDenial = {
  assetId: string;
  operation: DeniedOperation;
  /** `kintone.api`のとき、必要だった権限 */
  required: readonly Requirement[];
  /** HTTPメソッド(分かる場合) */
  method: string | null;
  /**
   * 操作の対象。`kintone.api`はクエリを除いたパス、外部通信はオリジン + パス
   *
   * クエリには業務データが載りうるため含めない
   */
  target: string | null;
};

export const PERMISSION_DENIED_CODE = 'AI_CUSTOMIZE_PERMISSION_DENIED';

/**
 * アセットの権限で許可されていない操作を止めたときのエラー
 *
 * アセット側の`catch`で扱えるよう、`code`で判別できる形にする
 */
export class PermissionDeniedError extends Error {
  readonly code = PERMISSION_DENIED_CODE;
  readonly denial: PermissionDenial;

  constructor(denial: PermissionDenial, message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
    this.denial = denial;
  }
}
