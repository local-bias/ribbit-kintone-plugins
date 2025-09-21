import { restorePluginConfig } from '@/lib/plugin';
import { manager } from '@/lib/event-manager';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { getMetaFieldId_UNSTABLE } from '@konomi-app/kintone-utilities';
import App from './app';

manager.add(['app.record.create.show', 'app.record.edit.show'], async (event) => {
  const config = restorePluginConfig();

  for (const condition of config.conditions) {
    if (!condition.targetFieldCode || !condition.srcAppId || !condition.srcFieldCode) {
      continue;
    }

    const targetFieldId = getMetaFieldId_UNSTABLE(condition.targetFieldCode);
    const targetField =
      document.querySelector<HTMLDivElement>(`.value-${targetFieldId} > div > div`) ||
      document.querySelector<HTMLDivElement>(`.value-${targetFieldId} > div`) ||
      document.querySelector<HTMLDivElement>(`.value-${targetFieldId}`);
    if (!targetField) {
      continue;
    }

    const initValue = event.record[condition.targetFieldCode].value as string;

    createRoot(targetField).render(<App initValue={initValue} condition={condition} />);
  }

  return event;
});
