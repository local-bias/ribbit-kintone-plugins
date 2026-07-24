/**
 * 不明な型のエラーオブジェクトからメッセージを抽出する
 * @param error - 任意のエラーオブジェクト
 * @param fallbackMessage - メッセージを抽出できない場合のデフォルトメッセージ
 * @returns エラーメッセージ文字列
 */
export const extractErrorMessage = (
  error: unknown,
  fallbackMessage = '不明なエラーが発生しました'
): string => {
  if (error === null || error === undefined) {
    return fallbackMessage;
  }

  // Error インスタンスの場合
  if (error instanceof Error) {
    return error.message;
  }

  // 文字列の場合
  if (typeof error === 'string') {
    return error;
  }

  // オブジェクトの場合
  if (typeof error === 'object') {
    if ('errors' in error && error.errors !== null && typeof error.errors === 'object') {
      const results: string[] = [];
      for (const key in error.errors) {
        const displayKey = key.replace(/^record\./, '').replace(/\.value$/, '');
        const value = (error.errors as Record<string, unknown>)[key];
        if (!value) {
          continue;
        }
        if (typeof value === 'string') {
          results.push(`${displayKey}: ${value}`);
        } else if (typeof value === 'object' && 'messages' in value) {
          const msgs = value.messages;
          if (Array.isArray(msgs)) {
            for (const msg of msgs) {
              if (typeof msg === 'string') {
                results.push(`${displayKey}: ${msg}`);
              }
            }
          }
        }
      }
      if (results.length > 0) {
        return results.join(', ');
      }
    }

    // message プロパティを持つ場合
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }

    // error プロパティを持つ場合（ネストされたエラー）
    if ('error' in error) {
      return extractErrorMessage((error as { error: unknown }).error, fallbackMessage);
    }

    // msg プロパティを持つ場合
    if ('msg' in error && typeof (error as { msg: unknown }).msg === 'string') {
      return (error as { msg: string }).msg;
    }

    // reason プロパティを持つ場合
    if ('reason' in error && typeof (error as { reason: unknown }).reason === 'string') {
      return (error as { reason: string }).reason;
    }

    // description プロパティを持つ場合
    if (
      'description' in error &&
      typeof (error as { description: unknown }).description === 'string'
    ) {
      return (error as { description: string }).description;
    }

    // JSON に変換を試みる
    try {
      const json = JSON.stringify(error);
      if (json !== '{}') {
        return json;
      }
    } catch {
      // JSON 変換に失敗した場合は無視
    }
  }

  // その他の場合は String() で変換
  try {
    const str = String(error);
    if (str !== '[object Object]') {
      return str;
    }
  } catch {
    // String 変換に失敗した場合は無視
  }

  return fallbackMessage;
};
