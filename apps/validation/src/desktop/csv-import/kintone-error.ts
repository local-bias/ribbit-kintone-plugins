/**
 * kintone REST API（特に bulkRequest）が返すエラーを解析し、
 * ユーザー向けのメッセージ一覧へ変換するユーティリティ。
 *
 * bulkRequest 失敗時は以下のような形式で返ります。
 * ```
 * {
 *   "results": [
 *     { "code": "GAIA_FU01", "id": "...", "message": "フィールド「X」の編集権限がありません。" },
 *     { "code": "CB_VA01", "message": "入力内容が正しくありません。",
 *       "errors": { "records[0].record.F.value": { "messages": ["必須です。"] } } }
 *   ]
 * }
 * ```
 */

/** kintone の `errors` マップ（フィールド単位の検証エラー）からメッセージを抽出します。 */
function extractFieldMessages(errors: unknown): string[] {
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  const messages: string[] = [];
  for (const entry of Object.values(errors as Record<string, unknown>)) {
    if (entry && typeof entry === 'object' && Array.isArray((entry as { messages?: unknown }).messages)) {
      for (const message of (entry as { messages: unknown[] }).messages) {
        if (typeof message === 'string' && message.length > 0) {
          messages.push(message);
        }
      }
    }
  }
  return messages;
}

/** bulkRequest の results 配列の1要素からメッセージを抽出します。 */
function extractResultMessages(result: unknown): string[] {
  if (!result || typeof result !== 'object') {
    return [];
  }

  const entry = result as { message?: unknown; errors?: unknown };
  const fieldMessages = extractFieldMessages(entry.errors);
  if (fieldMessages.length > 0) {
    return fieldMessages;
  }
  if (typeof entry.message === 'string' && entry.message.length > 0) {
    return [entry.message];
  }
  return [];
}

/**
 * kintone API のエラーから、ユーザー向けのメッセージ一覧を抽出します。
 * 同一メッセージが複数発生する場合があるため、重複は除去せずそのまま返します
 * （件数の集計は表示側で行います）。
 */
export function parseKintoneErrorMessages(error: unknown): string[] {
  const messages: string[] = [];

  if (error instanceof Error) {
    if (error.message) {
      messages.push(error.message);
    }
  } else if (error && typeof error === 'object') {
    const obj = error as { results?: unknown; errors?: unknown; message?: unknown };

    if (Array.isArray(obj.results)) {
      for (const result of obj.results) {
        messages.push(...extractResultMessages(result));
      }
    }

    messages.push(...extractFieldMessages(obj.errors));

    // results / errors から何も得られなかった場合のみ、トップレベルの message を採用する
    if (messages.length === 0 && typeof obj.message === 'string' && obj.message.length > 0) {
      messages.push(obj.message);
    }
  }

  return messages.length > 0 ? messages : ['レコードの取り込みに失敗しました。'];
}

/** メッセージ一覧を、同一メッセージごとに件数集計します（件数の多い順）。 */
export interface AggregatedErrorMessage {
  message: string;
  count: number;
}

export function aggregateErrorMessages(messages: string[]): AggregatedErrorMessage[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    counts.set(message, (counts.get(message) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count);
}
