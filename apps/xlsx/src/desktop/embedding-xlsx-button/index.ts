import { restorePluginConfig, getHeaderSpace } from '@konomi-app/kintone-utilities';
import { getButton } from './button-creation';
import { download } from './conversion';
import { createConfig } from '@/common/plugin';
import { listener } from '@/common/listener';
import { PLUGIN_ID } from '@/common/global';
import { toast } from '@konomi-app/ui';

const BUTTON_ID = 'ribbit-plugin-xlsx';

listener.add(['app.record.index.show'], async (event) => {
  // 既に設置済みの場合は処理しません
  if (document.querySelector(`#${BUTTON_ID}`)) {
    return event;
  }

  const storage = restorePluginConfig(PLUGIN_ID) ?? createConfig();

  const button = getButton(BUTTON_ID);
  const headerMenuSpace = getHeaderSpace(event.type);
  if (headerMenuSpace) {
    headerMenuSpace.append(button);
  }

  // クリック時のイベントを作成します
  button.onclick = async () => {
    button.disabled = true;
    try {
      await download(event, storage);
      toast.success('Excelファイルをダウンロードしました');
    } catch (error) {
      console.error(error);
      toast.error('ダウンロードに失敗しました');
    } finally {
      button.disabled = false;
    }
  };

  return event;
});
