import { PLUGIN_NAME } from '@/lib/constants';
import { manager } from '@/lib/event-manager';
import { isProd } from '@/lib/global';
import { store } from '@/lib/store';
import { getSpaceElement } from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import App from './components';
import { currentKintoneEventTypeAtom, pluginConfigAtom } from './states';

manager.add(
  ['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show'],
  async (event) => {
    const config = store.get(pluginConfigAtom);

    store.set(currentKintoneEventTypeAtom, event.type);

    const componentManager = ComponentManager.getInstance();
    componentManager.debug = !isProd;

    for (const condition of config.conditions) {
      const { id, targetSpaceId } = condition;
      const spaceElement = getSpaceElement(targetSpaceId);
      if (!spaceElement) {
        console.warn(
          `[${PLUGIN_NAME}] スペースID: ${targetSpaceId} のスペースフィールドが見つかりません。プラグインは無効となります。`
        );
        continue;
      }

      spaceElement.classList.add('🐸');

      componentManager.renderComponent({
        id,
        component: <App conditionId={id} />,
        parentElement: spaceElement,
      });
    }

    return event;
  }
);
