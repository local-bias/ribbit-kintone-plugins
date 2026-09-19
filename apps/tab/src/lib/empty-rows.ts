/** 行の表示状態の計測結果 */
export type RowMeasurement = {
  /**
   * 行が描画されているかどうか
   *
   * 閉じているグループフィールドの内側など、表示されていない親要素の中にある行は
   * 描画されていないため、中身の表示状態を測れません
   */
  isRendered: boolean;
  /** 行の中に、表示されている要素が1つでもあるかどうか */
  hasVisibleElement: boolean;
};

/** 行の振り分け結果 */
export type EmptyRowClassification<T> = {
  /** 表示できる要素が1つも無いため、畳む対象となる行 */
  collapsing: T[];
  /** 表示状態を測れないため、判定を保留する行 */
  deferred: T[];
};

/**
 * 行の計測結果から、畳む行と判定を保留する行を振り分けます
 *
 * 描画されていない行は「表示できる要素が無い行」と見分けが付かないため、判定を保留します。
 * 閉じているグループフィールドの内側にある行がこれに該当し、畳んでしまうと
 * グループを開いたときに中身が表示されなくなってしまいます。
 *
 * 計測は全ての行に対して先に行います。畳みながら測ると、先に畳んだ行が
 * 後続の行の計測結果へ影響してしまうためです。
 *
 * @param rows 判定対象の行
 * @param measure 行の表示状態を計測する関数
 * @returns 畳む行(`collapsing`)と、判定を保留する行(`deferred`)
 */
export const classifyEmptyRows = <T>(
  rows: readonly T[],
  measure: (row: T) => RowMeasurement
): EmptyRowClassification<T> => {
  const measurements = rows.map((row) => ({ row, measurement: measure(row) }));

  return {
    collapsing: measurements
      .filter(({ measurement }) => measurement.isRendered && !measurement.hasVisibleElement)
      .map(({ row }) => row),
    deferred: measurements
      .filter(({ measurement }) => !measurement.isRendered)
      .map(({ row }) => row),
  };
};
