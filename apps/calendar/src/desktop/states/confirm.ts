import { atom } from 'jotai';

export type ConfirmRequest = {
  title: string;
  message: string;
  /** 確定ボタンを破壊的な操作(削除など)の色で表示するかどうか */
  destructive?: boolean;
};

type ConfirmState = ConfirmRequest & { resolve: (confirmed: boolean) => void };

export const confirmStateAtom = atom<ConfirmState | null>(null);

/**
 * 確認ダイアログを開き、ユーザーが確定した場合に`true`を返します
 *
 * 別の確認ダイアログが開いている間に呼び出された場合、先に開いていた方はキャンセル扱いにします
 */
export const requestConfirmAtom = atom(null, (get, set, request: ConfirmRequest) => {
  get(confirmStateAtom)?.resolve(false);
  return new Promise<boolean>((resolve) => {
    set(confirmStateAtom, { ...request, resolve });
  });
});

export const answerConfirmAtom = atom(null, (get, set, confirmed: boolean) => {
  const state = get(confirmStateAtom);
  if (!state) return;
  set(confirmStateAtom, null);
  state.resolve(confirmed);
});
