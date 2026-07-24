import { getAllRecordsWithId, getRecords, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { CACHE_ENVELOPE_VERSION, type CacheEnvelope } from './record-cache';

/**
 * TODAY()等の相対日付関数を含むクエリは、レコードの編集を伴わないメンバーシップの変化
 * (日付が変わることで対象から外れる/入る)を差分取得で検知できない。
 * この場合は安価な整合性チェックをスキップし、必ず$idによるメンバーシップ照合を行う。
 */
const VOLATILE_QUERY_FUNCTION_PATTERN =
  /\bTODAY\s*\(|\bNOW\s*\(|\bFROM_TODAY\s*\(|\bTHIS_WEEK\s*\(|\bTHIS_MONTH\s*\(|\bLAST_MONTH\s*\(|\bTHIS_YEAR\s*\(/i;

export const hasVolatileQueryFunction = (filterQuery: string): boolean =>
  VOLATILE_QUERY_FUNCTION_PATTERN.test(filterQuery);

export const findUpdatedTimeFieldCode = (properties: kintoneAPI.FieldProperties): string | null => {
  const updatedTimeProperty = Object.values(properties).find(
    (property) => property.type === 'UPDATED_TIME'
  );
  return updatedTimeProperty?.code ?? null;
};

export const joinQueryConditions = (...parts: string[]): string => {
  const nonEmptyParts = parts.map((part) => part.trim()).filter((part) => part.length > 0);
  if (nonEmptyParts.length === 0) {
    return '';
  }
  return nonEmptyParts.map((part) => `(${part})`).join(' and ');
};

const isOrderByKeywordAt = (query: string, index: number): boolean => {
  if (!/^order\s+by\b/i.test(query.slice(index))) {
    return false;
  }
  const before = query[index - 1];
  return before === undefined || /\s/.test(before);
};

/**
 * kintoneのクエリ文法上、order byは条件式全体の末尾にのみ許される修飾句であり、
 * 括弧で囲んで他の条件とAND結合することはできない。
 * filterQueryを追加条件と合成する前に、末尾のorder by句を取り除く。
 *
 * 文字列リテラル(ダブルクォート)内に偶然「order by」という文字列が含まれていても
 * 誤って除去しないよう、引用符で囲まれた区間は走査対象から除外する。
 */
export const stripTrailingOrderBy = (query: string): string => {
  let inQuote = false;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === '"' && query[i - 1] !== '\\') {
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && isOrderByKeywordAt(query, i)) {
      return query.slice(0, i).trim();
    }
  }
  return query.trim();
};

const getRecordId = (record: kintoneAPI.RecordData): string => {
  const idField = record.$id as { value?: unknown } | undefined;
  return typeof idField?.value === 'string' ? idField.value : '';
};

/** $idでupsertし、getAllRecordsWithIdが前提とする$id降順を維持する */
export const mergeRecordsById = (
  base: kintoneAPI.RecordData[],
  incoming: kintoneAPI.RecordData[]
): kintoneAPI.RecordData[] => {
  const merged = new Map<string, kintoneAPI.RecordData>();
  for (const record of base) {
    merged.set(getRecordId(record), record);
  }
  for (const record of incoming) {
    merged.set(getRecordId(record), record);
  }
  return [...merged.values()].sort((a, b) => Number(getRecordId(b)) - Number(getRecordId(a)));
};

export const getMaxUpdatedTime = (
  records: kintoneAPI.RecordData[],
  updatedFieldCode: string
): string | null => {
  let max: string | null = null;
  // 文字列としての大小比較(value > max)は、秒精度とミリ秒精度が混在すると誤った結果になる
  // (例: "…:00Z" は "…:00.500Z" より時系列で先だが、'.'(0x2E) < 'Z'(0x5A) のため文字列比較では後者が勝る)。
  // 実時刻としての大小を比較するため、エポックミリ秒に変換してから比較する
  let maxMs = -Infinity;
  for (const record of records) {
    const field = record[updatedFieldCode] as { value?: unknown } | undefined;
    const value = field?.value;
    if (typeof value !== 'string') {
      continue;
    }
    const ms = Date.parse(value);
    if (Number.isNaN(ms)) {
      continue;
    }
    if (ms > maxMs) {
      maxMs = ms;
      max = value;
    }
  }
  return max;
};

type RevalidateCacheParams = {
  srcAppId: string;
  srcSpaceId: string | null;
  isSrcAppGuestSpace: boolean;
  filterQuery: string;
  /** undefinedの場合、初回取得時と同じく全フィールドを差分取得の対象にする */
  fields: string[] | undefined;
  updatedFieldCode: string;
  cached: CacheEnvelope;
  configHash: string;
  debug?: boolean;
};

export type RevalidateCacheResult =
  | { needsFullRefetch: true }
  | {
      needsFullRefetch: false;
      /** trueの場合、前回キャッシュからレコードの追加・更新・削除が一切なかったことを示す。
       * 呼び出し側はatomの再設定・エンベロープの再保存を省略してよい */
      unchanged: boolean;
      records: kintoneAPI.RecordData[];
      envelope: CacheEnvelope;
    };

/**
 * キャッシュ済みレコードを「更新日時 >= 前回の最大更新日時」の差分取得でマージし、
 * サーバー側の総件数と突き合わせて削除・フィルタ離脱を検知する。
 *
 * - filterQueryが空の場合: 削除は必ず件数を減らすため、件数の一致だけで整合性を保証できる
 * - filterQueryが非空の場合: フィルタ対象から外れた編集は差分取得に現れずキャッシュに残留しうる(ゴースト)ため、
 *   件数不一致または揮発関数を含む場合に$idのみのメンバーシップ照合を追加で行いゴーストを除去する
 *
 * どちらの場合も、整合性が取れないと判断した場合は全件再取得を要求する
 */
export const revalidateCache = async (
  params: RevalidateCacheParams
): Promise<RevalidateCacheResult> => {
  const {
    srcAppId,
    srcSpaceId,
    isSrcAppGuestSpace,
    filterQuery,
    fields,
    updatedFieldCode,
    cached,
    configHash,
    debug = false,
  } = params;
  const guestSpaceId = isSrcAppGuestSpace ? (srcSpaceId ?? undefined) : undefined;

  // 前回キャッシュ時点でレコードが0件だった場合、maxUpdatedTimeは空文字になる。
  // kintoneの日時フィールド比較は空文字を受け付けずAPIエラーになるため、
  // この場合は時刻での絞り込みを行わずfilterQueryのみで現在の一致レコードを取得する
  // (差分の基準となる前回データが無いため、一致するレコード全てが「新規」扱いになる)
  const changedQuery = cached.maxUpdatedTime
    ? joinQueryConditions(
        stripTrailingOrderBy(filterQuery),
        `${updatedFieldCode} >= "${cached.maxUpdatedTime}"`
      )
    : stripTrailingOrderBy(filterQuery);
  // 差分取得と件数取得を並行実行し、両者の間で状態が変化するレース窓を縮める
  const [changed, { totalCount }] = await Promise.all([
    getAllRecordsWithId({
      app: srcAppId,
      condition: changedQuery,
      fields,
      guestSpaceId,
      debug,
    }),
    getRecords({
      app: srcAppId,
      query: `${filterQuery} limit 1`,
      fields: ['$id'],
      totalCount: true,
      guestSpaceId,
      debug,
    }),
  ]);

  let merged = mergeRecordsById(cached.records, changed);
  const serverCount = Number(totalCount ?? 0);
  // 差分取得(changed)で1件でも取得された時点で、追加・更新のいずれかが発生している
  let recordsChanged = changed.length > 0;

  if (!filterQuery) {
    if (serverCount !== merged.length) {
      return { needsFullRefetch: true };
    }
  } else {
    const isConsistent =
      changed.length === 0 &&
      serverCount === merged.length &&
      !hasVolatileQueryFunction(filterQuery);

    if (!isConsistent) {
      // getAllRecordsWithIdは内部で$id順のページネーション条件を自前で付与するため、
      // filterQuery側の末尾order by句(特に大文字ORDER BYはkintone-utilities内部のstripが
      // 大文字小文字を区別せず一致しない場合がある)を先に取り除いておく必要がある
      const membershipRecords = await getAllRecordsWithId({
        app: srcAppId,
        condition: stripTrailingOrderBy(filterQuery),
        fields: ['$id'],
        guestSpaceId,
        debug,
      });
      const memberIds = new Set(membershipRecords.map((record) => getRecordId(record)));
      const filtered = merged.filter((record) => memberIds.has(getRecordId(record)));
      // フィルタ対象から外れた/削除されたレコード(ゴースト)が実際に取り除かれた場合のみ変化とみなす
      if (filtered.length !== merged.length) {
        recordsChanged = true;
      }
      merged = filtered;

      if (merged.length !== memberIds.size) {
        return { needsFullRefetch: true };
      }
    }
  }

  const envelope: CacheEnvelope = {
    version: CACHE_ENVELOPE_VERSION,
    savedAt: Date.now(),
    configHash,
    maxUpdatedTime: getMaxUpdatedTime(merged, updatedFieldCode) ?? cached.maxUpdatedTime,
    updatedFieldCode,
    count: merged.length,
    records: merged,
  };

  return { needsFullRefetch: false, unchanged: !recordsChanged, records: merged, envelope };
};
