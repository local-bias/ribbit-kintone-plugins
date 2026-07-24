import { getAllRecordsWithId } from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import { getAutocompleteValues, type PluginCondition } from '@/lib/plugin';
import { resolveUpdatedFieldCode, scheduleExpiredFormPropertiesCleanup } from './form-properties-cache';
import {
  buildConfigHash,
  CACHE_ENVELOPE_VERSION,
  cleanupLegacyLocalStorageCache,
  isPersistenceAvailable,
  loadCacheEnvelope,
  saveCacheEnvelope,
  scheduleExpiredCacheCleanup,
} from './persistent-cache';
import { getMaxUpdatedTime, revalidateCache } from './sync';

type LoadAutocompleteOptionsParams = {
  condition: PluginCondition;
  onValues: (values: string[], meta: { fromCache: boolean }) => void;
};

/**
 * 参照先アプリのレコードをIndexedDBキャッシュ経由でSWR(stale-while-revalidate)方式で読み込む。
 *
 * キャッシュがあれば即座に表示しつつバックグラウンドで差分検証を行い、無ければ通常どおり
 * 全件取得する。永続化が使えない環境や更新日時フィールドが解決できない場合は、キャッシュを
 * 一切使わない従来どおりの全件取得にフォールバックする。
 */
export const loadAutocompleteOptions = async (params: LoadAutocompleteOptionsParams): Promise<void> => {
  const { condition, onValues } = params;
  const { srcAppId, srcFieldCode } = condition;

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
  const configHash = persistable
    ? buildConfigHash({ srcAppId, guestSpaceId: GUEST_SPACE_ID, fields })
    : '';

  let hydratedFromCache = false;

  if (persistable) {
    const cached = await loadCacheEnvelope({ conditionId: condition.id, expectedConfigHash: configHash });

    if (cached) {
      // キャッシュを即時反映し、UIを待たせずに表示する(SWR)
      hydratedFromCache = true;
      onValues(getAutocompleteValues({ records: cached.records, srcFieldCode }), { fromCache: true });

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
            onValues(getAutocompleteValues({ records: result.records, srcFieldCode }), {
              fromCache: false,
            });
            await saveCacheEnvelope({ conditionId: condition.id, envelope: result.envelope });
          }
          scheduleExpiredCacheCleanup();
          scheduleExpiredFormPropertiesCleanup();
          return;
        }
        !isProd && console.info(`♻️ キャッシュに不整合を検知したため全件再取得します: ${condition.id}`);
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
      onValues(getAutocompleteValues({ records, srcFieldCode }), { fromCache: false });
    },
  });
  const values = getAutocompleteValues({ records, srcFieldCode });
  onValues(values, { fromCache: false });

  if (persistable) {
    await saveCacheEnvelope({
      conditionId: condition.id,
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
