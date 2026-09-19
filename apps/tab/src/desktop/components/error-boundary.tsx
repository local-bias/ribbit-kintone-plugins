import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { t } from '@/lib/i18n';

/**
 * 操作画面へ差し込むUIのためのエラー境界
 *
 * 設定画面で使用する`@repo/ui`の`ErrorBoundary`と異なり、フォールバックでは何も描画しません。
 *
 * - レコード画面の中でエラーの詳細を表示すると、幅を固定したタブの領域からはみ出して
 *   レコードのレイアウトごと崩れてしまいます。タブが消えるだけの方が実害が小さいため、
 *   利用者への通知は行わず、開発者向けにコンソールへ記録するだけに留めます
 * - `@mui/material`に依存しないため、操作画面のバンドルにUIライブラリを取り込まずに済みます
 */
export function DesktopErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={() => null}
      onError={(error) => {
        console.error(`[plugin] ${t('desktop.error.render')}`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
