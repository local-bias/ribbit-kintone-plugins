import { useAtomValue, useSetAtom } from '@repo/jotai';
import { useCallback, useEffect } from 'react';
import { t } from '@/lib/i18n';
import { codeDraftAtom, hasUnsavedChangesAtom } from '../states/asset-edit';

/**
 * 保存していない変更を捨てる操作(パネルを閉じる・一覧へ戻る・タブを変える)の前に確認するフック
 *
 * @returns 続けてよければ`true`(変更が無い、または破棄を承諾した)
 * @see docs/06-ui.md 4章
 */
export const useUnsavedGuard = (): (() => boolean) => {
  const draft = useAtomValue(codeDraftAtom);
  const setDraft = useSetAtom(codeDraftAtom);
  return useCallback(() => {
    if (draft === null) return true;
    if (!window.confirm(t('desktop.code.discardConfirm'))) return false;
    setDraft(null);
    return true;
  }, [draft, setDraft]);
};

/** 保存していない変更がある間、ブラウザの画面遷移で破棄を警告します */
export const useBeforeUnloadGuard = () => {
  const dirty = useAtomValue(hasUnsavedChangesAtom);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 古いブラウザは returnValue の設定で警告を出す
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
};
