import { css } from '@emotion/css';
import { getAppId, getHeaderSpace } from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { SnackbarProvider } from 'notistack';
import config from '@/../plugin.config.mjs';
import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { restorePluginConfig } from '@/lib/plugin';
import { ImportButton } from './components/import-button';

const componentManager = ComponentManager.getInstance();
componentManager.debug = isDev;

const MOUNT_ID = `${config.id}-csv-import`;

manager.add(['app.record.index.show'], async (event) => {
  const pluginConfig = restorePluginConfig();
  const { csvImport } = pluginConfig.common;

  if (!csvImport.enabled) {
    return event;
  }

  const appId = getAppId();
  if (!appId) {
    isDev && console.warn('[validation] アプリIDの取得に失敗しました。');
    return event;
  }

  const headerSpace = getHeaderSpace(event.type);
  if (!headerSpace) {
    isDev && console.warn('[validation] ヘッダースペースが見つかりませんでした。');
    return event;
  }

  componentManager.renderComponent({
    id: MOUNT_ID,
    parentElement: headerSpace,
    component: (
      <SnackbarProvider maxSnack={3}>
        <ImportButton
          label={csvImport.buttonLabel || 'CSVインポート（入力チェック付き）'}
          appId={appId}
          guestSpaceId={GUEST_SPACE_ID}
          conditions={pluginConfig.conditions}
          onImported={() => {
            location.reload();
          }}
        />
      </SnackbarProvider>
    ),
    onRootElementReady(element) {
      element.classList.add(css`
        display: inline-block;
      `);
    },
  });

  return event;
});
