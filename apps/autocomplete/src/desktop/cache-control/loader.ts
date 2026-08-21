import { getAllRecordsWithId } from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import { getAutocompleteValues, type PluginCondition } from '@/lib/plugin';
import { resolveUpdatedFieldCode, scheduleExpiredFormPropertiesCleanup } from './form-properties-cache';
import {
  buildConfigHash,
  buildDatasetKey,
  CACHE_ENVELOPE_VERSION,
  cleanupLegacyLocalStorageCache,
  isPersistenceAvailable,
  loadCacheEnvelope,
  saveCacheEnvelope,
  scheduleExpiredCacheCleanup,
} from './persistent-cache';
import { createSharedLoadRegistry, type EmitMeta } from './shared-load';
import { getMaxUpdatedTime, revalidateCache } from './sync';

type LoadAutocompleteOptionsParams = {
  condition: PluginCondition;
  onValues: (values: string[], meta: EmitMeta) => void;
};

/**
 * 同一の参照先(アプリ・フィールド)に対する読み込みをページ内で1回に集約するレジストリ。
 *
 * 参照先が同じであれば候補の内容も完全に一致するため、候補設定の数だけ
 * フィールド定義の解決・差分検証・レコード取得を繰り返す必要がない
 */
const loadRegistry = createSharedLoadRegistry<string[]>();

/** @internal テスト用。保持している共有結果を破棄する */
export const resetSharedLoads = (): void => loadRegistry.clear();

/**
 * 読み込みを共有できる単位を表すキー。
 *
 * フィールド定義の解決結果(更新日時フィールド)は参照先アプリから一意に決まるため、
 * 解決前の時点でも「参照先アプリ・ゲストスペース・参照先フィールド」だけで
 * 最終的な候補が同一になることが保証される
 */
const buildRequestKey = (params: {
  srcAppId: string;
  guestSpaceId: string | undefined;
  srcFieldCode: string;
}): string => JSON.stringify([params.srcAppId, params.guestSpaceId ?? null, params.srcFieldCode]);

/**
 * 参照先アプリのレコードをIndexedDBキャッシュ経由でSWR(stale-while-revalidate)方式で読み込む。
 *
 * キャッシュがあれば即座に表示しつつバックグラウンドで差分検証を行い、無ければ通常どおり
 * 全件取得する。永続化が使えない環境や更新日時フィールドが解決できない場合は、キャッシュを
 * 一切使わない従来どおりの全件取得にフォールバックする。
 *
 * 同一の参照先を持つ候補設定が複数ある場合、実際の取得処理は1回だけ行われ、
 * 2件目以降はその結果を共有する(取得中なら途中経過から、取得済みなら即座に)。
 */
export const loadAutocompleteOptions = async (params: LoadAutocompleteOptionsParams): Promise<void> => {
  const { condition, onValues } = params;
  const { srcAppId, srcFieldCode } = condition;

  const requestKey = buildRequestKey({ srcAppId, guestSpaceId: GUEST_SPACE_ID, srcFieldCode });

  await loadRegistry.run(requestKey, {
    onEmit: onValues,
    load: (emit) => fetchAutocompleteValues({ srcAppId, srcFieldCode, emit }),
  });
};

type FetchAutocompleteValuesParams = {
  srcAppId: string;
  srcFieldCode: string;
  emit: (values: string[], meta: EmitMeta) => void;
};

const fetchAutocompleteValues = async (params: FetchAutocompleteValuesParams): Promise<void> => {
  const { srcAppId, srcFieldCode, emit } = params;

  // isPersistenceAvailable()の結果を1度だけ取得して使い回す。persistenceGuardは
  // record-cacheとform-properties-cacheで共有されており、下のawaitを挟んで
  // 再度呼び出すと、並行呼び出しによるquota超過等で判定がぶれる可能性があるため
  const persistenceAvailableAtStart = isPersistenceAvailable();
  const updatedFieldCode = persistenceAvailableAtStart
    ? await resolveUpdatedFieldCode({ srcAppId, guestSpaceId: GUEST_SPACE_ID }).catch((error) => {
        !isProd && console.error('更新日時フィールドの解決に失敗しました', error);
        return null;
      })
    : null;
  const persistable = persistenceAvailableAtStart && updatedFieldCode !== null;
  const fields = persistable ? [...new Set([srcFieldCode, updatedFieldCode])] : [srcFieldCode];
  const identity = { srcAppId, guestSpaceId: GUEST_SPACE_ID, fields };
  const datasetKey = buildDatasetKey(identity);
  const configHash = persistable ? buildConfigHash(identity) : '';

  let hydratedFromCache = false;

  if (persistable) {
    const cached = await loadCacheEnvelope({ datasetKey, expectedConfigHash: configHash });

    if (cached) {
      // キャッシュを即時反映し、UIを待たせずに表示する(SWR)
      hydratedFromCache = true;
      emit(getAutocompleteValues({ records: cached.records, srcFieldCode }), { fromCache: true });

      try {
        const result = await revalidateCache({
          srcAppId,
          guestSpaceId: GUEST_SPACE_ID,
          fields,
          updatedFieldCode,
          cached,
          configHash,
        });

        if (!result.needsFullRefetch) {
          // unchangedの場合、SWRハイドレート時点のcached.recordsと内容が同一のため、
          // 候補の再設定・エンベロープの再保存を省略する
          if (!result.unchanged) {
            emit(getAutocompleteValues({ records: result.records, srcFieldCode }), {
              fromCache: false,
            });
            await saveCacheEnvelope({ datasetKey, envelope: result.envelope });
          }
          scheduleExpiredCacheCleanup();
          scheduleExpiredFormPropertiesCleanup();
          return;
        }
        !isProd && console.info(`♻️ キャッシュに不整合を検知したため全件再取得します: ${datasetKey}`);
      } catch (error) {
        // 同期に失敗しても、ハイドレート済みのキャッシュはそのまま利用可能なため処理を継続する。
        // 候補は入力補助であり鮮度が多少古くても致命的ではないため、専用のUI警告は出さない
        !isProd && console.error('キャッシュの再検証に失敗しました', error);
        return;
      }
    }
  }

  const records = await getAllRecordsWithId({
    app: srcAppId,
    fields,
    guestSpaceId: GUEST_SPACE_ID,
    debug: !isProd,
    onStep: ({ records }) => {
      if (hydratedFromCache) {
        return;
      }
      emit(getAutocompleteValues({ records, srcFieldCode }), { fromCache: false });
    },
  });
  const values = getAutocompleteValues({ records, srcFieldCode });
  emit(values, { fromCache: false });

  if (persistable) {
    await saveCacheEnvelope({
      datasetKey,
      envelope: {
        version: CACHE_ENVELOPE_VERSION,
        savedAt: Date.now(),
        configHash,
        maxUpdatedTime: getMaxUpdatedTime(records, updatedFieldCode) ?? '',
        updatedFieldCode,
        count: records.length,
        records,
      },
    });
  }

  cleanupLegacyLocalStorageCache();
  scheduleExpiredCacheCleanup();
  scheduleExpiredFormPropertiesCleanup();
};
