import { getSpaceElement, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { PLUGIN_NAME } from '@/lib/constants';
import { manager } from '@/lib/event-manager';
import { isProd } from '@/lib/global';
import { store } from '@/lib/store';
import App from './components';
import { currentKintoneEventTypeAtom, pluginConfigAtom } from './states';

const config = store.get(pluginConfigAtom);

const componentManager = ComponentManager.getInstance();
componentManager.debug = !isProd;

for (const condition of config.conditions) {
  const events: kintoneAPI.js.EventType[] = [];
  if (condition.targetEvents.includes('create')) {
    events.push('app.record.create.show');
  }
  if (condition.targetEvents.includes('edit')) {
    events.push('app.record.edit.show');
  }
  if (condition.targetEvents.includes('detail')) {
    events.push('app.record.detail.show');
  }

  manager.add(events, async (event) => {
    store.set(currentKintoneEventTypeAtom, event.type);

    const { id, targetSpaceId, disableVanillaFileField } = condition;
    const spaceElement = getSpaceElement(targetSpaceId);
    if (!spaceElement) {
      console.warn(
        `[${PLUGIN_NAME}] スペースID: ${targetSpaceId} のスペースフィールドが見つかりません。プラグインは無効となります。`
      );
      return event;
    }

    if (disableVanillaFileField) {
      const fileField = event.record[condition.targetFileFieldCode];
      if (fileField) {
        // @ts-expect-error 型定義がないため
        fileField.disabled = true;
      }
    }

    spaceElement.classList.add('🐸');

    componentManager.renderComponent({
      id,
      component: <App conditionId={id} />,
      parentElement: spaceElement,
    });

    return event;
  });
}
