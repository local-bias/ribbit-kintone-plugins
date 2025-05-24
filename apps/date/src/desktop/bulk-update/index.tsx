import { manager } from '@/lib/event-manager';
import { restorePluginConfig } from '@/lib/plugin';
import {
  getCybozuUserGroups,
  getCybozuUserOrganizations,
  getHeaderSpace,
} from '@konomi-app/kintone-utilities';
import { createRoot } from 'react-dom/client';
import Button from './button';

let rendered = false;
manager.add(['app.record.index.show'], async (event) => {
  if (rendered) {
    return event;
  }

  const storage = restorePluginConfig();

  const headerElement = getHeaderSpace(event.type);

  if (!headerElement) {
    console.warn('ヘッダー要素が見つかりませんでした。');
    return event;
  }

  for (const condition of storage.conditions) {
    if (!condition.isBulkUpdateButtonVisible) {
      continue;
    }
    if (condition.isBulkUpdateButtonVisibleForSpecificEntities) {
      const { visibleFor } = condition;

      const isGroupRestricted = visibleFor.some((entity) => entity.type === 'group');
      const isOrganizationRestricted = visibleFor.some((entity) => entity.type === 'organization');

      const userCode = kintone.getLoginUser().code;
      const { groups } = isGroupRestricted ? await getCybozuUserGroups(userCode) : { groups: [] };
      const { organizations } = isOrganizationRestricted
        ? await getCybozuUserOrganizations(userCode)
        : { organizations: [] };

      const isButtonVisible = visibleFor.some((entity) => {
        switch (entity.type) {
          case 'user':
            return entity.code === userCode;
          case 'group':
            return groups.some((group) => group.code === entity.code);
          case 'organization':
            return organizations.some((organization) => organization.code === entity.code);
        }
      });
      if (!isButtonVisible) {
        continue;
      }
    }
    const rootElement = document.createElement('span');
    rootElement.style.display = 'inline-flex';
    rootElement.style.alignItems = 'center';
    rootElement.style.margin = '0 4px';
    headerElement.append(rootElement);
    createRoot(rootElement).render(<Button condition={condition} />);
  }

  rendered = true;
  return event;
});
