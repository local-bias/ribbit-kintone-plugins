import { useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown };

/**
 * 依存値が変わるたびに非同期処理を実行し、その状態を返すフック。
 * アンマウントや依存変更後の遅延解決による状態更新は破棄します。
 */
export function useAsync<T>(factory: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    factory()
      .then((data) => {
        if (active) setState({ status: 'success', data });
      })
      .catch((error) => {
        if (active) setState({ status: 'error', error });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
