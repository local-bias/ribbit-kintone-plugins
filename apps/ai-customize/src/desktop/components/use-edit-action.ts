import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { t } from '@/lib/i18n';
import type { EditOutcome } from '../states/asset-edit';

/**
 * 利用者の操作によるイベントか
 *
 * アセットのコードは同じページで動くため、`.click()`でパネルを操作して自分に権限を付与できてしまう。
 * 付与・公開・保存など、できることが増える操作は、偽装できない`isTrusted`のイベントだけで行う
 *
 * @see docs/08-security.md 2-5章
 */
export const isTrustedEvent = (event: { nativeEvent: Event }): boolean =>
  event.nativeEvent.isTrusted === true;

/**
 * 編集操作を実行し、結果を通知するフック
 *
 * 実行中は`busy`を立てる。想定外の失敗(一覧の取り直しの失敗など)も握りつぶさずに通知する
 */
export const useEditAction = (): [
  boolean,
  (action: () => Promise<EditOutcome | null>) => Promise<EditOutcome | null>,
] => {
  const { enqueueSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (action: () => Promise<EditOutcome | null>) => {
      setBusy(true);
      try {
        const outcome = await action();
        if (outcome !== null) enqueueSnackbar(outcome.message, { variant: outcome.variant });
        return outcome;
      } catch (error) {
        console.error('[ai-customize]', error);
        const outcome: EditOutcome = {
          variant: 'error',
          message: t('desktop.edit.failed', error instanceof Error ? error.message : String(error)),
        };
        enqueueSnackbar(outcome.message, { variant: outcome.variant });
        return outcome;
      } finally {
        setBusy(false);
      }
    },
    [enqueueSnackbar]
  );
  return [busy, run];
};
