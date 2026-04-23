import { listener } from '@/common/listener';
import { restorePluginConfig } from '@/lib/plugin';
import { getHeaderSpace } from '@konomi-app/kintone-utilities';
import { toast } from '@konomi-app/ui';
import { getButton } from './button-creation';
import { download } from './conversion';

const BUTTON_ID = 'ribbit-plugin-xlsx';

listener.add(['app.record.index.show'], async (event) => {
  // 既に設置済みの場合は処理しません
  if (document.querySelector(`#${BUTTON_ID}`)) {
    return event;
  }

  const pluginConfig = restorePluginConfig();
  const viewId = String(event.viewId);

  // 現在の一覧に適用する条件を選択します（優先度: 配列の後ろほど高い）
  const matchingCondition = [...pluginConfig.conditions].reverse().find((condition) => {
    if (!condition.targetViewsEnabled) return true;
    return condition.targetViews.includes(viewId);
  });

  if (!matchingCondition) {
    return event;
  }

  const button = getButton(BUTTON_ID);
  const headerMenuSpace = getHeaderSpace(event.type);
  if (headerMenuSpace) {
    headerMenuSpace.append(button);
  }

  // クリック時のイベントを作成します
  button.onclick = async () => {
    button.disabled = true;
    try {
      await download(event, matchingCondition);
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
