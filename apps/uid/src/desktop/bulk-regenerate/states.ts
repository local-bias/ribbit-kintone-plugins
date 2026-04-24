import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  cybozuUserCodeAtom,
  cybozuUserGroupsAtom,
  cybozuUserOrganizationsAtom,
  pluginConditionsAtom,
} from '../public-state';

export const isButtonShownAtom = atomFamily((conditionId: string) =>
  atom(async (get) => {
    const conditions = get(pluginConditionsAtom);
    const condition = conditions.find((c) => c.id === conditionId);
    if (!condition) {
      return false;
    }

    if (!condition.isBulkRegenerateButtonLimited) {
      return true;
    }

    const userCode = get(cybozuUserCodeAtom);
    const userGroups = await get(cybozuUserGroupsAtom);
    const userOrganizations = await get(cybozuUserOrganizationsAtom);

    return condition.bulkRegenerateButtonShownUsers.some(({ type, code }) => {
      switch (type) {
        case 'user': {
          return code === userCode;
        }
        case 'group': {
          return userGroups.some((group) => group.code === code);
        }
        case 'organization': {
          return userOrganizations.some((organization) => organization.code === code);
        }
        default: {
          return false;
        }
      }
    });
  })
);
