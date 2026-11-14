import type { AssetAccess } from './asset-access';

/**
 * 有効スイッチを押したときに行うことを決めます(純粋関数)
 *
 * - レコードを編集できれば「状態」を更新する(全員に効く)
 * - 編集できなければ、このブラウザでだけ無効にする(ローカル無効化)
 * - ローカル無効化を解除するのは、いつでも自分でできる
 *
 * @see docs/06-ui.md 5章「有効スイッチの挙動」、docs/05-runtime.md 8章
 */

export type ToggleAction =
  | { type: 'update-record'; enabled: boolean; unmute: boolean }
  | { type: 'mute' }
  | { type: 'unmute' }
  | { type: 'forbidden'; reason: 'no-permission' | 'unavailable' };

/** スイッチの表示上の状態(レコードで有効、かつこのブラウザで無効にしていない) */
export const isEffectivelyEnabled = (enabled: boolean, muted: boolean): boolean =>
  enabled && !muted;

export const decideToggle = (params: {
  /** レコードの「状態」が有効か */
  enabled: boolean;
  /** このブラウザで無効にしているか */
  muted: boolean;
  access: AssetAccess;
}): ToggleAction => {
  const { enabled, muted, access } = params;
  if (enabled && muted) {
    return { type: 'unmute' };
  }
  if (enabled) {
    return access.canToggleStatus
      ? { type: 'update-record', enabled: false, unmute: false }
      : { type: 'mute' };
  }
  if (access.canToggleStatus) {
    return { type: 'update-record', enabled: true, unmute: muted };
  }
  return { type: 'forbidden', reason: access.unavailable ? 'unavailable' : 'no-permission' };
};
