import { t } from '@/lib/i18n';
import { toast } from '@konomi-app/ui';
import { KintoneEventManager } from '@konomi-app/kintone-utilities';
import { isProd } from '@/lib/global';

export const manager = new KintoneEventManager({
  logDisabled: isProd,
});

const PLUGIN_NAME = '____PLUGIN_NAME____';

const LOCAL_STORAGE_KEY = `ribbit-version-migration`;

manager.add(['app.record.index.show'], async (event) => {
  // 1日に1回だけ、バージョン更新を促す通知を表示する
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  const now = new Date();
  if (stored) {
    const last = new Date(stored);
    const diff = now.getTime() - last.getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      return event;
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, now.toISOString());

  toast.info(PLUGIN_NAME, { description: t('migration.notification'), duration: 10000 });

  return event;
});
