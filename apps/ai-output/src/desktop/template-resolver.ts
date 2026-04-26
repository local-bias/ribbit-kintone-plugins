import { getAllRecords, getFieldValueAsString } from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID } from '@/lib/global';

/**
 * 第1パス: ローカルで解決可能なプレースホルダーを置換する
 */
export function resolveLocalPlaceholders(
  template: string,
  record: Record<string, { type: string; value: unknown }>,
  loginUser: { name: string; code: string; email?: string }
): string {
  let resolved = template;

  // {{field:XXX}} の置換
  resolved = resolved.replace(/\{\{field:(.+?)\}\}/g, (_, fieldCode: string) => {
    const field = record[fieldCode];
    if (!field) {
      return `[不明なフィールド: ${fieldCode}]`;
    }
    return getFieldValueAsString(field);
  });

  // {{record}} の置換
  resolved = resolved.replace(/\{\{record\}\}/g, () => {
    return JSON.stringify(record);
  });

  // {{today}} の置換
  resolved = resolved.replace(/\{\{today\}\}/g, () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // {{now}} の置換
  resolved = resolved.replace(/\{\{now\}\}/g, () => {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '');
  });

  // {{login_user}} の置換
  resolved = resolved.replace(/\{\{login_user\}\}/g, () => {
    return JSON.stringify(loginUser);
  });

  return resolved;
}

/**
 * 第2パス: 外部APIを呼び出してプレースホルダーを置換する
 */
export async function resolveExternalPlaceholders(
  template: string,
  maxRecords: number
): Promise<string> {
  // {{app:ID:query:QUERY}} または {{app:ID:query:QUERY:fields:F1,F2}} を抽出
  const pattern = /\{\{app:(\d+):query:(.*?)(?::fields:(.+?))?\}\}/g;
  const matches: Array<{
    full: string;
    appId: string;
    query: string;
    fields: string[] | undefined;
  }> = [];

  let match;
  while ((match = pattern.exec(template)) !== null) {
    matches.push({
      full: match[0],
      appId: match[1],
      query: match[2],
      fields: match[3] ? match[3].split(',').map((f) => f.trim()) : undefined,
    });
  }

  if (matches.length === 0) {
    return template;
  }

  const results = await Promise.all(
    matches.map(async (m) => {
      const params: Parameters<typeof getAllRecords>[0] = {
        app: m.appId,
        condition: m.query,
        guestSpaceId: GUEST_SPACE_ID,
        debug: false,
      };
      if (m.fields) {
        params.fields = m.fields;
      }
      const records = await getAllRecords(params);
      // 最大取得件数で制限
      return records.slice(0, maxRecords);
    })
  );

  let resolved = template;
  matches.forEach((m, i) => {
    resolved = resolved.replace(m.full, JSON.stringify(results[i]));
  });

  return resolved;
}
