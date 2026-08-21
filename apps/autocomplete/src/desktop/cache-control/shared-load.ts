/**
 * 同一データセットに対する読み込みを、ページ内で1回にまとめるための共有レジストリ。
 *
 * 1つのレコード画面に「参照先アプリ・参照先フィールドが同一」の候補設定が複数配置されている場合、
 * 各設定が個別にフィールド定義の解決・キャッシュ検証・レコード取得を行うと、
 * 取得結果が完全に同一であるにもかかわらず設定の数だけAPIを消費してしまう。
 *
 * このレジストリはキーごとに読み込み処理を1つだけ走らせ、
 * - 実行中に参加した呼び出し元には、以降の途中経過・最終結果をそのまま配信する
 * - 完了後に参加した呼び出し元には、保持している最新の結果を即座に再生する(API呼び出しなし)
 * ことで、API使用回数を削減しつつ2件目以降の描画を待ち時間ゼロにする。
 */

export type EmitMeta = { fromCache: boolean };

type Emit<T> = (payload: T, meta: EmitMeta) => void;

type SharedLoad<T> = {
  subscribers: Set<Emit<T>>;
  /** 直近に配信した結果。完了後に参加した呼び出し元へ再生するために保持する */
  last: { payload: T; meta: EmitMeta } | null;
  promise: Promise<void>;
  /** 未完了の場合はnull */
  completedAt: number | null;
};

export type SharedLoadRegistry<T> = {
  run(
    key: string,
    params: {
      onEmit: Emit<T>;
      load: (emit: Emit<T>) => Promise<void>;
    }
  ): Promise<void>;
  /** @internal テストおよび明示的な再読み込みのために保持中の結果を破棄する */
  clear(): void;
};

/**
 * 完了済みの結果を再利用する期間。
 *
 * kintoneはレコード画面の遷移をページ遷移なしで行うことがあり、レジストリがタブの寿命だけ
 * 生き続ける可能性がある。無期限に再利用すると候補がいつまでも更新されないため、
 * 一定時間を過ぎた再読み込みは許可する。その場合もIndexedDBキャッシュが効くため、
 * 実際に発生するのは差分検証の軽量なクエリ1回のみ
 */
export const SHARED_LOAD_TTL_MS = 5 * 60 * 1000;

export const createSharedLoadRegistry = <T>(params?: { ttlMs?: number }): SharedLoadRegistry<T> => {
  const ttlMs = params?.ttlMs ?? SHARED_LOAD_TTL_MS;
  const loads = new Map<string, SharedLoad<T>>();

  const isReusable = (load: SharedLoad<T>): boolean =>
    load.completedAt === null || Date.now() - load.completedAt <= ttlMs;

  const run: SharedLoadRegistry<T>['run'] = (key, { onEmit, load }) => {
    const existing = loads.get(key);

    if (existing && isReusable(existing)) {
      // 途中経過・最終結果のいずれであっても、保持している最新の値を即座に反映する
      if (existing.last) {
        onEmit(existing.last.payload, existing.last.meta);
      }
      if (existing.completedAt !== null) {
        return Promise.resolve();
      }
      existing.subscribers.add(onEmit);
      // 購読解除はどの経路でも必要なため、成否に関わらず必ず実行する
      return existing.promise.finally(() => {
        existing.subscribers.delete(onEmit);
      });
    }

    const shared: SharedLoad<T> = {
      subscribers: new Set([onEmit]),
      last: null,
      completedAt: null,
      promise: Promise.resolve(),
    };

    const emit: Emit<T> = (payload, meta) => {
      shared.last = { payload, meta };
      // 配信中に購読者が増減しても走査が壊れないようスナップショットを取る
      for (const subscriber of [...shared.subscribers]) {
        subscriber(payload, meta);
      }
    };

    // load()が同期的に例外を投げた場合でもcatch節がこのエントリを取り除けるよう、
    // 読み込みを開始する前に登録しておく
    loads.set(key, shared);

    shared.promise = (async () => {
      try {
        await load(emit);
        shared.completedAt = Date.now();
      } catch (error) {
        // 失敗した結果を再利用すると、以降の呼び出しが永続的にエラーになるため破棄する
        if (loads.get(key) === shared) {
          loads.delete(key);
        }
        throw error;
      } finally {
        shared.subscribers.clear();
      }
    })();

    return shared.promise;
  };

  return {
    run,
    clear: () => loads.clear(),
  };
};
