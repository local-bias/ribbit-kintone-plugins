import { getApp, getFormFields } from '@konomi-app/kintone-utilities';
import { z } from 'zod';
import type { IdbStore } from './idb';
import { createPersistenceGuard, isQuotaExceededError, type PersistenceGuard } from './record-cache';
import { findUpdatedTimeFieldCode } from './sync';

const CACHE_ENVELOPE_VERSION = 1;
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const CacheEnvelopeSchema = z.object({
  version: z.literal(CACHE_ENVELOPE_VERSION),
  savedAt: z.number(),
  appModifiedAt: z.string(),
  updatedFieldCode: z.string().nullable(),
});

type CacheEnvelope = z.infer<typeof CacheEnvelopeSchema>;

export interface UpdatedFieldCodeCache {
  isPersistenceAvailable(): boolean;
  disablePersistence(): void;
  /**
   * 参照先アプリの更新日時(UPDATED_TIME)フィールドのコードを解決する。
   *
   * アプリの`modifiedAt`(アプリ設定が変更されるたびに更新される)をフィンガープリントとして使い、
   * 前回キャッシュ時から変化していなければ、重いgetFormFieldsを省略し軽いgetAppのみで済ませる。
   * `modifiedAt`が異なる場合(フィールド追加・削除・リネーム等、アプリ設定への何らかの変更があった場合)は、
   * キャッシュを使わず必ず最新のフィールド定義から再解決し、古い情報が残らないようにする。
   */
  resolveUpdatedFieldCode(params: {
    srcAppId: string;
    guestSpaceId: string | undefined;
  }): Promise<string | null>;
  /** 自キャッシュ分の期限切れ・破損エントリをアイドル時にまとめて削除する */
  scheduleCleanup(): void;
}

export const createUpdatedFieldCodeCache = (params: {
  idbStore: IdbStore;
  keyPrefix: string;
  ttlMs?: number;
  debug?: boolean;
  persistenceGuard?: PersistenceGuard;
}): UpdatedFieldCodeCache => {
  const { idbStore, keyPrefix, ttlMs = DEFAULT_CACHE_TTL_MS, debug = false } = params;
  const guard = params.persistenceGuard ?? createPersistenceGuard();

  // srcAppId・guestSpaceIdのみでキーを構成する。参照先アプリのフィールド定義はそのアプリ自体のスキーマであり、
  // どのルックアップ条件・プラグインインスタンス・ログインユーザーから見ても同一のため、
  // それらでスコープを絞らずキャッシュを共有する(レコードキャッシュとは異なりACLで内容が変わらないため安全)
  const buildCacheKey = (params: { srcAppId: string; guestSpaceId: string | undefined }): string =>
    `${keyPrefix}:${params.srcAppId}:${params.guestSpaceId ?? ''}`;

  const loadEnvelope = async (key: string): Promise<CacheEnvelope | null> => {
    try {
      const raw = await idbStore.get(key);
      if (raw === undefined) {
        return null;
      }

      const parsed = CacheEnvelopeSchema.safeParse(raw);
      if (!parsed.success) {
        await idbStore.delete(key).catch(() => undefined);
        return null;
      }

      if (Date.now() - parsed.data.savedAt > ttlMs) {
        await idbStore.delete(key).catch(() => undefined);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  };

  const saveEnvelope = async (key: string, envelope: CacheEnvelope): Promise<void> => {
    try {
      await idbStore.put(key, envelope);
    } catch (error) {
      await idbStore.delete(key).catch(() => undefined);
      if (isQuotaExceededError(error)) {
        guard.disable();
      }
    }
  };

  const resolveUpdatedFieldCode: UpdatedFieldCodeCache['resolveUpdatedFieldCode'] = async ({
    srcAppId,
    guestSpaceId,
  }) => {
    const key = buildCacheKey({ srcAppId, guestSpaceId });
    const cached = guard.isAvailable() ? await loadEnvelope(key) : null;

    const persistAndReturn = async (
      app: { modifiedAt: string },
      properties: Parameters<typeof findUpdatedTimeFieldCode>[0]
    ): Promise<string | null> => {
      const updatedFieldCode = findUpdatedTimeFieldCode(properties);
      if (guard.isAvailable()) {
        await saveEnvelope(key, {
          version: CACHE_ENVELOPE_VERSION,
          savedAt: Date.now(),
          appModifiedAt: app.modifiedAt,
          updatedFieldCode,
        });
      }
      return updatedFieldCode;
    };

    if (cached) {
      const app = await getApp({ id: srcAppId, guestSpaceId, debug });
      if (app.modifiedAt === cached.appModifiedAt) {
        return cached.updatedFieldCode;
      }
      // フィンガープリントの検証で取得済みのapp情報を再利用し、getAppを重複呼び出ししない
      const { properties } = await getFormFields({ app: srcAppId, guestSpaceId, debug });
      return persistAndReturn(app, properties);
    }

    const [{ properties }, app] = await Promise.all([
      getFormFields({ app: srcAppId, guestSpaceId, debug }),
      getApp({ id: srcAppId, guestSpaceId, debug }),
    ]);
    return persistAndReturn(app, properties);
  };

  const scheduleCleanup: UpdatedFieldCodeCache['scheduleCleanup'] = () => {
    if (!guard.isAvailable()) {
      return;
    }

    idbStore.scheduleIdleCleanup({
      keyPrefix: `${keyPrefix}:`,
      isExpired: (raw) => {
        const parsed = CacheEnvelopeSchema.safeParse(raw);
        return !parsed.success || Date.now() - parsed.data.savedAt > ttlMs;
      },
    });
  };

  return {
    isPersistenceAvailable: guard.isAvailable,
    disablePersistence: guard.disable,
    resolveUpdatedFieldCode,
    scheduleCleanup,
  };
};
