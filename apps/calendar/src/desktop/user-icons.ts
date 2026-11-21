/**
 * cybozu.comのユーザーのアイコンを取得する
 *
 * `kintone.user.getIcons`は型定義(@kintone/dts-gen)にまだ含まれておらず、提供されていない環境も
 * 考えられるため、存在を確認してから呼び出す。取得できない場合は呼び出し側で頭文字を表示する
 */

/** `kintone.user.getIcons`で一度に指定できるユーザー数の上限 */
const GET_ICONS_LIMIT = 100;

type GetIcons = (users: string[]) => Promise<{ user: string; url: string }[]>;

const getIconsApi = (): GetIcons | null => {
  const api = (kintone as unknown as { user?: { getIcons?: GetIcons } }).user?.getIcons;
  return typeof api === 'function' ? api : null;
};

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size)
  );

/**
 * ユーザーコード(ログイン名)ごとのアイコンのURLを返します
 *
 * - APIが提供されていない環境では、すべてのユーザーを取得済み(アイコンなし)として扱う
 * - 100件ごとの問い合わせのうち失敗したものは`failed`に含め、呼び出し側で後から再取得できるようにする
 *   (失敗した問い合わせがあっても、成功した分のアイコンは使用する)
 */
export const fetchUserIconUrls = async (
  codes: string[]
): Promise<{ urls: Record<string, string>; failed: string[] }> => {
  const getIcons = getIconsApi();
  if (!getIcons || codes.length === 0) {
    return { urls: {}, failed: [] };
  }
  const chunks = chunk(codes, GET_ICONS_LIMIT);
  const results = await Promise.allSettled(chunks.map((users) => getIcons(users)));

  const urls: Record<string, string> = {};
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      for (const { user, url } of result.value) {
        urls[user] = url;
      }
    } else {
      console.error('ユーザーのアイコンの取得に失敗しました', result.reason);
      failed.push(...(chunks[i] ?? []));
    }
  });
  return { urls, failed };
};
