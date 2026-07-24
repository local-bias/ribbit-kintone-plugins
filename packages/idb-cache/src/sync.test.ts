import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_ENVELOPE_VERSION, type CacheEnvelope } from './record-cache';

const { getAllRecordsWithIdMock, getRecordsMock } = vi.hoisted(() => ({
  getAllRecordsWithIdMock: vi.fn(),
  getRecordsMock: vi.fn(),
}));

vi.mock('@konomi-app/kintone-utilities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@konomi-app/kintone-utilities')>();
  return {
    ...actual,
    getAllRecordsWithId: getAllRecordsWithIdMock,
    getRecords: getRecordsMock,
  };
});

const {
  findUpdatedTimeFieldCode,
  getMaxUpdatedTime,
  hasVolatileQueryFunction,
  joinQueryConditions,
  mergeRecordsById,
  revalidateCache,
  stripTrailingOrderBy,
} = await import('./sync');

const UPDATED_FIELD = '更新日時';

const makeRecord = (
  id: string,
  updatedAt: string,
  extra: Record<string, kintoneAPI.RecordData[string]> = {}
): kintoneAPI.RecordData => ({
  $id: { type: '__ID__', value: id },
  [UPDATED_FIELD]: { type: 'UPDATED_TIME', value: updatedAt },
  ...extra,
});

beforeEach(() => {
  getAllRecordsWithIdMock.mockReset();
  getRecordsMock.mockReset();
});

describe('mergeRecordsById', () => {
  it('$idでupsertし、既存レコードを新しい値で上書きする', () => {
    const base = [makeRecord('1', '2026-01-01T00:00:00Z')];
    const incoming = [makeRecord('1', '2026-02-01T00:00:00Z')];
    const merged = mergeRecordsById(base, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.[UPDATED_FIELD]?.value).toBe('2026-02-01T00:00:00Z');
  });

  it('新しいレコードを追加する', () => {
    const base = [makeRecord('1', '2026-01-01T00:00:00Z')];
    const incoming = [makeRecord('2', '2026-01-02T00:00:00Z')];
    const merged = mergeRecordsById(base, incoming);
    expect(merged.map((r) => r.$id?.value)).toEqual(['2', '1']);
  });

  it('結果を$id降順でソートする', () => {
    const base = [makeRecord('1', '2026-01-01T00:00:00Z'), makeRecord('3', '2026-01-01T00:00:00Z')];
    const incoming = [makeRecord('2', '2026-01-01T00:00:00Z')];
    const merged = mergeRecordsById(base, incoming);
    expect(merged.map((r) => r.$id?.value)).toEqual(['3', '2', '1']);
  });

  it('incoming内に同一$idの重複があっても1件に正規化する(境界の重複排除)', () => {
    const base = [makeRecord('1', '2026-01-01T00:00:00Z')];
    const incoming = [
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('1', '2026-01-01T00:00:00Z'),
    ];
    const merged = mergeRecordsById(base, incoming);
    expect(merged).toHaveLength(1);
  });
});

describe('getMaxUpdatedTime', () => {
  it('最大の更新日時を返す', () => {
    const records = [
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-03-01T00:00:00Z'),
      makeRecord('3', '2026-02-01T00:00:00Z'),
    ];
    expect(getMaxUpdatedTime(records, UPDATED_FIELD)).toBe('2026-03-01T00:00:00Z');
  });

  it('レコードが空の場合はnullを返す', () => {
    expect(getMaxUpdatedTime([], UPDATED_FIELD)).toBeNull();
  });

  it('秒精度とミリ秒精度が混在していても実時刻として正しい最大値を返す(文字列比較では誤る境界値)', () => {
    const records = [
      // 文字列比較では"…:00Z" > "…:00.500Z"と誤判定されるが、実時刻としては後者が新しい
      makeRecord('1', '2026-01-01T00:00:00.500Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
    ];
    expect(getMaxUpdatedTime(records, UPDATED_FIELD)).toBe('2026-01-01T00:00:00.500Z');
  });

  it('不正な日時文字列は無視して残りのレコードから最大値を返す', () => {
    const records = [makeRecord('1', 'invalid-date'), makeRecord('2', '2026-01-01T00:00:00Z')];
    expect(getMaxUpdatedTime(records, UPDATED_FIELD)).toBe('2026-01-01T00:00:00Z');
  });
});

describe('hasVolatileQueryFunction', () => {
  it.each([
    'more.更新日 = TODAY()',
    'more.日付 > NOW()',
    'more.日付 = FROM_TODAY(-3, "DAYS")',
    'more.日付 = THIS_MONTH()',
    'more.日付 = THIS_WEEK()',
    'more.日付 = LAST_MONTH()',
    'more.日付 = THIS_YEAR()',
  ])('揮発関数を含むクエリ「%s」を検知する', (query) => {
    expect(hasVolatileQueryFunction(query)).toBe(true);
  });

  it('揮発関数を含まないクエリはfalseを返す', () => {
    expect(hasVolatileQueryFunction('ステータス = "完了"')).toBe(false);
  });

  it('関数呼び出しではない単語の部分一致では誤検知しない', () => {
    expect(hasVolatileQueryFunction('メモ like "TODAYFIELD"')).toBe(false);
  });
});

describe('joinQueryConditions', () => {
  it('複数の条件をandで結合する', () => {
    expect(joinQueryConditions('a = "1"', 'b = "2"')).toBe('(a = "1") and (b = "2")');
  });

  it('空文字列の条件は無視する', () => {
    expect(joinQueryConditions('', 'b = "2"')).toBe('(b = "2")');
  });

  it('すべて空の場合は空文字列を返す', () => {
    expect(joinQueryConditions('', '  ')).toBe('');
  });
});

describe('stripTrailingOrderBy', () => {
  it('末尾のorder by句を取り除く', () => {
    expect(stripTrailingOrderBy('ステータス = "対応中" order by 更新日時 desc')).toBe(
      'ステータス = "対応中"'
    );
  });

  it('order by句を含まない場合はそのまま返す', () => {
    expect(stripTrailingOrderBy('ステータス = "対応中"')).toBe('ステータス = "対応中"');
  });

  it('空文字列の場合は空文字列を返す', () => {
    expect(stripTrailingOrderBy('')).toBe('');
  });

  it('大文字小文字を区別せずorder by句を取り除く', () => {
    expect(stripTrailingOrderBy('ステータス = "対応中" ORDER BY 更新日時 desc')).toBe(
      'ステータス = "対応中"'
    );
  });

  it('文字列リテラル内の"order by"は除去しない(値の一部として保持する)', () => {
    expect(stripTrailingOrderBy('件名 like "purchase order by john"')).toBe(
      '件名 like "purchase order by john"'
    );
  });

  it('文字列リテラル内に"order by"を含みつつ、末尾に実際のorder by句がある場合は末尾のみ取り除く', () => {
    expect(
      stripTrailingOrderBy('件名 like "purchase order by john" order by 更新日時 desc')
    ).toBe('件名 like "purchase order by john"');
  });
});

describe('findUpdatedTimeFieldCode', () => {
  it('UPDATED_TIME型のフィールドコードを返す(リネーム済みでも対応)', () => {
    const properties = {
      更新した日時: { type: 'UPDATED_TIME', code: '更新した日時', label: '', noLabel: false },
      文字列: {
        type: 'SINGLE_LINE_TEXT',
        code: '文字列',
        label: '',
        noLabel: false,
        required: false,
        unique: false,
        maxLength: '',
        minLength: '',
        defaultValue: '',
        expression: '',
        hideExpression: false,
      },
    } as unknown as kintoneAPI.FieldProperties;
    expect(findUpdatedTimeFieldCode(properties)).toBe('更新した日時');
  });

  it('UPDATED_TIMEフィールドが存在しない場合はnullを返す', () => {
    const properties = {
      文字列: {
        type: 'SINGLE_LINE_TEXT',
        code: '文字列',
        label: '',
        noLabel: false,
        required: false,
        unique: false,
        maxLength: '',
        minLength: '',
        defaultValue: '',
        expression: '',
        hideExpression: false,
      },
    } as unknown as kintoneAPI.FieldProperties;
    expect(findUpdatedTimeFieldCode(properties)).toBeNull();
  });
});

describe('revalidateCache', () => {
  const baseParams = {
    srcAppId: '1',
    srcSpaceId: null,
    isSrcAppGuestSpace: false,
    fields: ['$id', UPDATED_FIELD],
    updatedFieldCode: UPDATED_FIELD,
    configHash: 'hash-a',
  };

  const buildCached = (
    records: kintoneAPI.RecordData[],
    maxUpdatedTime = '2026-01-01T00:00:00Z'
  ): CacheEnvelope => ({
    version: CACHE_ENVELOPE_VERSION,
    savedAt: Date.now(),
    configHash: 'hash-a',
    maxUpdatedTime,
    updatedFieldCode: UPDATED_FIELD,
    count: records.length,
    records,
  });

  it('filterQueryが空・差分なし・件数一致の場合は整合済みとしてキャッシュをそのまま返す', async () => {
    const cached = buildCached([
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
    ]);
    getAllRecordsWithIdMock.mockResolvedValueOnce([]); // 差分取得
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '2' });

    const result = await revalidateCache({ ...baseParams, filterQuery: '', cached });

    expect(result.needsFullRefetch).toBe(false);
    if (!result.needsFullRefetch) {
      expect(result.records).toHaveLength(2);
      // 差分・削除ともに無いため、呼び出し側は再描画・再保存を省略してよい
      expect(result.unchanged).toBe(true);
    }
    // メンバーシップ照合(ids-only)は呼ばれない
    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(1);
  });

  it('差分取得で更新レコードが1件でもあればunchanged=falseを返す', async () => {
    const cached = buildCached([makeRecord('1', '2026-01-01T00:00:00Z')]);
    getAllRecordsWithIdMock.mockResolvedValueOnce([makeRecord('1', '2026-02-01T00:00:00Z')]);
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    const result = await revalidateCache({ ...baseParams, filterQuery: '', cached });

    expect(result.needsFullRefetch).toBe(false);
    if (!result.needsFullRefetch) {
      expect(result.unchanged).toBe(false);
    }
  });

  it('メンバーシップ照合でゴーストが除去された場合はunchanged=falseを返す', async () => {
    const filterQuery = 'ステータス = "対応中"';
    const cached = buildCached([
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
    ]);
    getAllRecordsWithIdMock.mockImplementation(async ({ condition }: { condition: string }) => {
      if (condition === filterQuery) {
        return [makeRecord('2', '2026-01-01T00:00:00Z')];
      }
      return [];
    });
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    const result = await revalidateCache({ ...baseParams, filterQuery, cached });

    expect(result.needsFullRefetch).toBe(false);
    if (!result.needsFullRefetch) {
      expect(result.unchanged).toBe(false);
    }
  });

  it('filterQueryにorder by句を含む場合、差分取得クエリが壊れない(末尾のorder byを除去してから合成する)', async () => {
    const cached = buildCached([makeRecord('1', '2026-01-01T00:00:00Z')]);
    getAllRecordsWithIdMock.mockResolvedValueOnce([]);
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    await revalidateCache({
      ...baseParams,
      filterQuery: 'ステータス = "対応中" order by 更新日時 desc',
      cached,
    });

    const [{ condition }] = getAllRecordsWithIdMock.mock.calls[0] as [{ condition: string }];
    // order byが合成後の条件の途中に紛れ込み、後続のAND条件が失われていないことを確認する
    expect(condition).toBe('(ステータス = "対応中") and (更新日時 >= "2026-01-01T00:00:00Z")');
    expect(condition).not.toContain('order by');
  });

  it('filterQueryが空・純粋な削除の場合は件数不一致で全件再取得を要求する', async () => {
    const cached = buildCached([
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
    ]);
    getAllRecordsWithIdMock.mockResolvedValueOnce([]); // 差分なし(削除は差分取得に現れない)
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' }); // 1件削除された

    const result = await revalidateCache({ ...baseParams, filterQuery: '', cached });

    expect(result.needsFullRefetch).toBe(true);
  });

  it('filterQueryが空・削除+作成が同時発生した場合も件数不一致で全件再取得を要求する', async () => {
    const cached = buildCached([
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
      makeRecord('3', '2026-01-01T00:00:00Z'),
    ]);
    // レコード4が新規作成され差分取得に現れる(レコード1は削除され、差分には現れない)
    getAllRecordsWithIdMock.mockResolvedValueOnce([makeRecord('4', '2026-03-01T00:00:00Z')]);
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '3' });

    const result = await revalidateCache({ ...baseParams, filterQuery: '', cached });

    // マージ後は4件(1,2,3,4)だがサーバー総件数は3件のため不一致を検知する
    expect(result.needsFullRefetch).toBe(true);
  });

  it('filterQueryが非空・差分なし・件数一致・非揮発の場合はメンバーシップ照合をスキップする', async () => {
    const cached = buildCached([makeRecord('1', '2026-01-01T00:00:00Z')]);
    getAllRecordsWithIdMock.mockResolvedValueOnce([]);
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    const result = await revalidateCache({
      ...baseParams,
      filterQuery: 'ステータス = "対応中"',
      cached,
    });

    expect(result.needsFullRefetch).toBe(false);
    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(1);
  });

  it('filterQueryが非空・フィルタ対象から外れたレコードをゴーストとして除去する', async () => {
    const filterQuery = 'ステータス = "対応中"';
    const cached = buildCached([
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
    ]);
    // レコード1がフィルタ対象から外れたため、差分取得(filterQuery込み)には現れない
    getAllRecordsWithIdMock.mockImplementation(async ({ condition }: { condition: string }) => {
      if (condition === filterQuery) {
        return [makeRecord('2', '2026-01-01T00:00:00Z')];
      }
      return [];
    });
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    const result = await revalidateCache({ ...baseParams, filterQuery, cached });

    expect(result.needsFullRefetch).toBe(false);
    if (!result.needsFullRefetch) {
      expect(result.records.map((r) => r.$id?.value)).toEqual(['2']);
    }
  });

  it('filterQueryが大文字ORDER BYで終わる場合、メンバーシップ照合クエリも壊れない', async () => {
    const filterQuery = 'ステータス = "対応中" ORDER BY 更新日時 desc';
    const strippedQuery = 'ステータス = "対応中"';
    const cached = buildCached([
      makeRecord('1', '2026-01-01T00:00:00Z'),
      makeRecord('2', '2026-01-01T00:00:00Z'),
    ]);
    // レコード1がフィルタ対象から外れたため、差分取得には現れない。
    // メンバーシップ照合クエリはorder byが取り除かれた形で渡されるべき
    getAllRecordsWithIdMock.mockImplementation(async ({ condition }: { condition: string }) => {
      if (condition === strippedQuery) {
        return [makeRecord('2', '2026-01-01T00:00:00Z')];
      }
      return [];
    });
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    const result = await revalidateCache({ ...baseParams, filterQuery, cached });

    expect(result.needsFullRefetch).toBe(false);
    if (!result.needsFullRefetch) {
      expect(result.records.map((r) => r.$id?.value)).toEqual(['2']);
    }
    const membershipCall = getAllRecordsWithIdMock.mock.calls.find(
      (call) => (call[0] as { condition: string }).condition === strippedQuery
    );
    expect(membershipCall).toBeDefined();
  });

  it('メンバーシップに存在するが取得できないレコードがある場合(相対日付フィルタ等)は全件再取得を要求する', async () => {
    const filterQuery = '日付 = TODAY()';
    const cached = buildCached([makeRecord('1', '2026-01-01T00:00:00Z')]);
    getAllRecordsWithIdMock.mockImplementation(async ({ condition }: { condition: string }) => {
      if (condition === filterQuery) {
        // レコード2がメンバーシップに含まれるが、更新日時が古く差分取得では拾えない
        return [makeRecord('1', '2026-01-01T00:00:00Z'), makeRecord('2', '2020-01-01T00:00:00Z')];
      }
      return [];
    });
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '2' });

    const result = await revalidateCache({ ...baseParams, filterQuery, cached });

    expect(result.needsFullRefetch).toBe(true);
  });

  it('前回0件キャッシュ(maxUpdatedTimeが空文字)の場合、時刻での絞り込みをせずfilterQueryのみで取得する', async () => {
    const cached = buildCached([], '');
    getAllRecordsWithIdMock.mockResolvedValueOnce([makeRecord('1', '2026-03-01T00:00:00Z')]);
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    const result = await revalidateCache({ ...baseParams, filterQuery: '', cached });

    const [{ condition }] = getAllRecordsWithIdMock.mock.calls[0] as [{ condition: string }];
    // 更新日時での絞り込み条件(>=)が含まれない(空文字比較によるkintone APIエラーを回避する)
    expect(condition).toBe('');
    expect(condition).not.toContain(UPDATED_FIELD);

    expect(result.needsFullRefetch).toBe(false);
    if (!result.needsFullRefetch) {
      expect(result.records.map((r) => r.$id?.value)).toEqual(['1']);
    }
  });

  it('前回0件キャッシュ・filterQueryが非空の場合も、時刻条件を付けずfilterQueryのみで取得する', async () => {
    const filterQuery = 'ステータス = "対応中"';
    const cached = buildCached([], '');
    const newRecord = makeRecord('1', '2026-03-01T00:00:00Z');
    // 差分取得(1回目)と、changed.length!==0による追加のメンバーシップ照合(2回目)の両方をモックする
    getAllRecordsWithIdMock.mockResolvedValueOnce([newRecord]).mockResolvedValueOnce([newRecord]);
    getRecordsMock.mockResolvedValueOnce({ records: [], totalCount: '1' });

    await revalidateCache({ ...baseParams, filterQuery, cached });

    const [{ condition }] = getAllRecordsWithIdMock.mock.calls[0] as [{ condition: string }];
    expect(condition).toBe(filterQuery);
    expect(condition).not.toContain(UPDATED_FIELD);
  });
});
