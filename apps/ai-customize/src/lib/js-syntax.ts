/**
 * JSアセットの構文を検査します(評価はしない)
 *
 * 実行時(`runner.ts`)と同じ形の関数として組み立てる。組み立てるだけで、コードは動かない。
 * 問題が無ければ`null`、あればエラーの説明
 */
export const checkJsSyntax = (code: string): string | null => {
  try {
    new Function('kintone', 'context', code);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};
