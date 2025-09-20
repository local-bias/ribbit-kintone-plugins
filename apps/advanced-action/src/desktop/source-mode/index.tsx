import { manager } from '@/lib/event-manager';
import { css } from '@emotion/css';
import { getHeaderSpace } from '@konomi-app/kintone-utilities';
import { ComponentManager } from '@konomi-app/kintone-utilities-react';
import { store } from '@repo/jotai';
import { validPluginConditionsAtom } from '../public-state';
import ActionButton from './button';

const componentManager = ComponentManager.getInstance();

manager.add(['app.record.detail.show'], (event) => {
  const conditions = store.get(validPluginConditionsAtom);
  if (conditions.length === 0) {
    return event;
  }

  const headerElement = getHeaderSpace(event.type);
  if (!headerElement) {
    return event;
  }

  const containerElement = document.createElement('div');
  containerElement.classList.add(css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  `);
  headerElement.append(containerElement);

  for (const condition of conditions) {
    componentManager.renderComponent({
      id: condition.id,
      parentElement: containerElement,
      component: <ActionButton condition={condition} record={event.record} />,
    });
  }

  return event;
});
