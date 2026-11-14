import type { AssetPermission } from '@/schema/asset';

/**
 * kintone REST APIの呼び出しを、必要な権限へ分類します
 *
 * HTTPメソッドだけでは判定しない。`bulkRequest`はPOSTだが中身に削除を含められ、
 * カーソルの作成はPOSTだが読み取りである。
 *
 * @see docs/13-launch-gate-and-permissions.md 3-3章
 */

/**
 * 呼び出しに必要な権限の1要素
 *
 * - `read`: 常に許可
 * - `post-or-put`: 追加または更新のどちらかがあればよい(ファイルのアップロード)
 * - `unrestricted`: 「制限なし」でなければ許可しない(アプリ設定の変更、未知の操作など)
 */
export type Requirement = 'read' | 'post' | 'put' | 'delete' | 'post-or-put' | 'unrestricted';

/** 呼び出しに必要な権限。全ての要素を満たす必要がある */
export type RequiredPermissions = readonly Requirement[];

const KNOWN_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE']);

/** `bulkRequest`の入れ子で再帰させない深さ */
const MAX_BULK_DEPTH = 1;

/**
 * kintoneのAPIパスを正規化します
 *
 * - 絶対URL・相対パスのどちらも受ける。kintoneと異なるオリジンは`null`
 * - `/k/guest/{id}/v1/` を `/k/v1/` へ寄せる
 * - クエリと末尾の`.json`を除く
 */
export const normalizeKintonePath = (pathOrUrl: string, origin: string): string | null => {
  let url: URL;
  try {
    url = new URL(pathOrUrl, origin);
  } catch {
    return null;
  }
  if (url.origin !== new URL(origin).origin) {
    return null;
  }
  return url.pathname.replace(/^\/k\/guest\/\d+\/v1\//, '/k/v1/').replace(/\.json$/, '');
};

const RECORD_WRITE_PATHS = new Set(['/k/v1/record', '/k/v1/records']);
const PROCESS_PATHS = new Set([
  '/k/v1/record/status',
  '/k/v1/records/status',
  '/k/v1/record/assignees',
]);

const METHOD_TO_REQUIREMENT: Record<string, Requirement> = {
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
};

type BulkRequestItem = { method?: unknown; api?: unknown; payload?: unknown };

const classifyBulkRequest = (
  params: unknown,
  origin: string,
  depth: number
): RequiredPermissions => {
  const requests = (params as { requests?: unknown } | null)?.requests;
  if (!Array.isArray(requests) || requests.length === 0 || depth >= MAX_BULK_DEPTH) {
    return ['unrestricted'];
  }
  const union = new Set<Requirement>();
  for (const item of requests as BulkRequestItem[]) {
    if (typeof item?.api !== 'string' || typeof item?.method !== 'string') {
      return ['unrestricted'];
    }
    for (const requirement of classify(item.api, item.method, item.payload, origin, depth + 1)) {
      union.add(requirement);
    }
  }
  return [...union];
};

const classify = (
  pathOrUrl: string,
  rawMethod: string,
  params: unknown,
  origin: string,
  depth: number
): RequiredPermissions => {
  const method = rawMethod.toUpperCase();
  if (!KNOWN_METHODS.has(method)) {
    return ['unrestricted'];
  }
  const path = normalizeKintonePath(pathOrUrl, origin);
  if (path === null) {
    return ['unrestricted'];
  }
  if (method === 'GET') {
    return ['read'];
  }
  if (path === '/k/v1/records/cursor' && (method === 'POST' || method === 'DELETE')) {
    return ['read'];
  }
  const write = METHOD_TO_REQUIREMENT[method];
  if (RECORD_WRITE_PATHS.has(path) && write !== undefined) {
    return [write];
  }
  if (
    path === '/k/v1/record/comment' &&
    (method === 'POST' || method === 'DELETE') &&
    write !== undefined
  ) {
    return [write];
  }
  if (PROCESS_PATHS.has(path) && method === 'PUT') {
    return ['put'];
  }
  if (path === '/k/v1/file' && method === 'POST') {
    return ['post-or-put'];
  }
  if (path === '/k/v1/bulkRequest' && method === 'POST') {
    return classifyBulkRequest(params, origin, depth);
  }
  return ['unrestricted'];
};

/**
 * `kintone.api(pathOrUrl, method, params)` の呼び出しに必要な権限を返します
 *
 * @param origin kintoneのオリジン(`location.origin`)
 */
export const classifyKintoneRequest = (
  pathOrUrl: unknown,
  method: unknown,
  params: unknown,
  origin: string
): RequiredPermissions => {
  if (typeof pathOrUrl !== 'string' || typeof method !== 'string') {
    return ['unrestricted'];
  }
  return classify(pathOrUrl, method, params, origin, 0);
};

const isRequirementGranted = (
  requirement: Requirement,
  granted: ReadonlySet<AssetPermission>
): boolean => {
  if (requirement === 'read' || granted.has('unrestricted')) {
    return true;
  }
  switch (requirement) {
    case 'post':
    case 'put':
    case 'delete':
      return granted.has(requirement);
    case 'post-or-put':
      return granted.has('post') || granted.has('put');
    case 'unrestricted':
      return false;
  }
};

/** 必要な権限が全て付与されているか判定します */
export const isGranted = (
  required: RequiredPermissions,
  permissions: readonly AssetPermission[]
): boolean => {
  const granted = new Set(permissions);
  return required.every((requirement) => isRequirementGranted(requirement, granted));
};

/** 書き込み系(追加・更新・削除)の権限を1つ以上持つか */
export const hasAnyWritePermission = (permissions: readonly AssetPermission[]): boolean =>
  permissions.some(
    (permission) =>
      permission === 'post' ||
      permission === 'put' ||
      permission === 'delete' ||
      permission === 'unrestricted'
  );
