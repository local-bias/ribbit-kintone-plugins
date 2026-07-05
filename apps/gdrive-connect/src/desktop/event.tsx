import {
  getAppId,
  getRecordId,
  getSpaceElement,
  updateRecord,
} from '@konomi-app/kintone-utilities';
import { Provider, store } from '@repo/jotai';
import { createRoot } from 'react-dom/client';
import { deleteFolder } from '@/lib/drive';
import { manager } from '@/lib/event-manager';
import { isDev } from '@/lib/global';
import { createRecordFolder, readFolderId } from '@/lib/record-folder';
import Panel from './components/panel';
import { pluginConfigAtom, validPluginConditionsAtom } from './public-state';
import { driveTokenAtom, isDriveTokenValidAtom } from './states/drive';

manager.add(['app.record.detail.show', 'app.record.edit.show'], async (event) => {
  const config = store.get(pluginConfigAtom);
  const conditions = store.get(validPluginConditionsAtom);
  const isEdit = event.type === 'app.record.edit.show';
  const appId = getAppId();
  const recordId = getRecordId();

  for (const condition of conditions) {
    const spaceElement = getSpaceElement(condition.targetSpaceId);
    if (!spaceElement) {
      continue;
    }

    const root = document.createElement('div');
    spaceElement.append(root);
    createRoot(root).render(
      <Provider store={store}>
        <Panel
          condition={condition}
          oauthClientId={config.common.oauthClientId}
          oauthClientSecret={config.common.oauthClientSecret}
          record={event.record}
          isEdit={isEdit}
          appId={appId}
          recordId={recordId}
        />
      </Provider>
    );
  }

  return event;
});

/**
 * 「レコード保存時に作成」を選択した条件について、保存直後にGoogleドライブフォルダを作成します
 *
 * この時点でレコードは保存済みのため、フォルダIDは常にREST APIで更新します(編集中の値のstageは不可)。
 * Googleドライブへの接続はユーザー操作(ポップアップ)が必要なため、この時点で有効なトークンが
 * メモリ上に存在しない場合(このセッションで一度も接続していない場合)は、静かにスキップします。
 */
manager.add(
  ['app.record.create.submit.success', 'app.record.edit.submit.success'],
  async (event) => {
    const conditions = store
      .get(validPluginConditionsAtom)
      .filter((condition) => condition.folderCreationTrigger === 'onSave');
    if (conditions.length === 0) {
      return event;
    }

    const token = store.get(driveTokenAtom);
    if (!store.get(isDriveTokenValidAtom) || !token) {
      if (isDev) {
        console.warn(
          '[gdrive-connect] Googleドライブに未接続のため、保存時のフォルダ自動作成をスキップしました。'
        );
      }
      return event;
    }

    for (const condition of conditions) {
      if (readFolderId(event.record, condition.folderIdFieldCode)) {
        continue;
      }
      let created: { id: string } | null = null;
      try {
        created = await createRecordFolder({
          accessToken: token.accessToken,
          condition,
          record: event.record,
        });
        await updateRecord({
          app: event.appId,
          id: event.recordId,
          record: { [condition.folderIdFieldCode]: { value: created.id } },
        });
      } catch (cause) {
        console.error('[gdrive-connect] フォルダの自動作成に失敗しました', cause);
        // フォルダ作成後にレコードへのID書き込みが失敗した場合、孤立フォルダを残さないようロールバックする
        if (created) {
          try {
            await deleteFolder({ accessToken: token.accessToken, folderId: created.id });
          } catch (rollbackCause) {
            console.error(
              '[gdrive-connect] 孤立フォルダのロールバックに失敗しました',
              rollbackCause
            );
          }
        }
      }
    }

    return event;
  }
);
